"""Export observed API/UI results separately from the user's manual execution sheet."""
import argparse
import hashlib
import json
import os
import re
import shutil
from collections import Counter
from pathlib import Path
from openpyxl import load_workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.worksheet.datavalidation import DataValidation

parser = argparse.ArgumentParser()
parser.add_argument('--run', required=True)
parser.add_argument('--source', required=True)
parser.add_argument('--output', required=True)
args = parser.parse_args()
root = Path.cwd().resolve()
run = Path(args.run).resolve()
source = Path(args.source).resolve()
output = Path(args.output).resolve()
for path in (run, source, output):
    if root not in path.parents:
        raise SystemExit('Files must stay within this repository')
if output.exists() or output == source:
    raise SystemExit('Refusing to overwrite an existing workbook')
report = json.loads((run / 'execution.json').read_text(encoding='utf-8'))
if report.get('label') != 'assisted-40' or not report.get('finished'):
    raise SystemExit('A completed assisted-40 run is required')
original_hash = hashlib.sha256(source.read_bytes()).hexdigest()
book = load_workbook(source)
manual = book['Execution']
headers = [cell.value for cell in manual[1]]
cases = [dict(zip(headers, values)) for values in manual.iter_rows(min_row=2, values_only=True) if values[headers.index('Test Case ID')]]
if len(cases) != 40 or len({row['Test Case ID'] for row in cases}) != 40:
    raise SystemExit('Source must contain exactly 40 unique cases')
output.parent.mkdir(parents=True, exist_ok=False)
evidence = output.parent / 'evidence'
evidence.mkdir()
ui_cases = {'TC-AUTH-001', 'TC-AUTH-002', 'TC-AUTH-005', 'TC-AUTH-011',
            'TC-AUTHZ-001', 'TC-AUTHZ-002', 'TC-AUTHZ-003', 'TC-APPT-016',
            'TC-PAY-002', 'TC-PAY-003', 'TC-PAY-012', 'TC-PAY-016', 'TC-PAY-017'}
columns = ['Run ID', 'Build commit', 'Executed at', 'Executor', 'Test Case ID', 'Priority',
           'Description', 'Precondition', 'Actual data / IDs', 'Steps', 'Expected', 'Actual',
           'Status', 'Bug ID', 'Evidence', 'Hinh thuc xac minh', 'Pham vi / gioi han', 'Anh can bo sung']
sheet = book.create_sheet('Ket qua ho tro 40 case', 0)
sheet.append(columns)
overview = book.create_sheet('Tong hop ho tro', 0)
manual_before = [tuple(row) for row in manual.iter_rows(values_only=True)]
counts = Counter()
exported = []
for item in cases:
    case_id = item['Test Case ID']
    matches = [row for row in report['results'] if case_id in row.get('testCaseIds', [])]
    if len(matches) != 1:
        raise SystemExit(f'{case_id}: expected exactly one observed execution, got {len(matches)}')
    result = matches[0]
    actual = json.loads(result['actual'])
    observations = actual.get('observations', [])
    if result['status'] == 'Pass' and not observations:
        raise SystemExit(f'{case_id}: refusing a Pass without observations')
    status = result['status']
    if status == 'Not Run':
        status = 'Blocked'
    scope = 'Assertions API/UI theo case; không phải manual execution.'
    if result['status'] == 'Fail' and 'cy.screenshot()' in str(actual.get('error', '')) and 'timed out' in str(actual.get('error', '')):
        status = 'Blocked'
        scope = 'Lỗi công cụ chụp ảnh/timeout; không kết luận lỗi nghiệp vụ từ lỗi thu evidence này.'
    # The source case specifies now == startTime; real HTTP has measurable scheduling delay.
    if case_id == 'TC-APPT-014' and status == 'Pass':
        status = 'Blocked'
        scope = 'HTTP 200 và checkInTime đã lưu; chưa xác minh now == startTime đúng 0 ms. Cần kiểm soát đồng hồ/đối chiếu thời gian trước khi kết luận đầy đủ case.'
    rows = []
    fixture_data = []
    for observation in observations:
        if observation.get('fixtureKey'):
            fixture_data.append({key: value for key, value in observation.items() if key != 'observedAt'})
            continue
        if observation.get('method'):
            fields = []
            labels = {'status': 'trạng thái', 'recordCount': 'số bản ghi', 'tokenPresent': 'có token',
                      'passwordPresent': 'có password trong response', 'role': 'vai trò', 'error': 'thông báo lỗi',
                      'amountPaid': 'thực thu', 'finalAmount': 'thành tiền', 'debt': 'công nợ',
                      'paymentMethod': 'phương thức', 'checkInTime': 'giờ check-in', 'totalAmount': 'tổng tiền'}
            for key, label in labels.items():
                if key in observation:
                    value = observation[key]
                    if isinstance(value, bool): value = 'có' if value else 'không'
                    fields.append(f'{label}: {value}')
            rows.append(f"{observation['method']} {observation.get('path', '')} → HTTP {observation.get('httpStatus')}; " + '; '.join(fields))
        elif 'emailRequired' in observation:
            rows.append('UI kiểm tra email/mật khẩu bắt buộc; vẫn ở trang đăng nhập và không tạo phiên.')
        elif 'logoutClearsToken' in observation:
            rows.append('UI đăng xuất xóa token; truy cập lại /accounts chuyển về /login.')
        elif 'canonicalEmailMatchesSeed' in observation:
            rows.append('Email trong response khớp email chữ thường của tài khoản QA sau khi nhập email viết hoa.')
        elif 'actualCheckInOffsetMs' in observation:
            rows.append(f"Chênh lệch checkInTime - startTime thực tế: {observation['actualCheckInOffsetMs']} ms; không dùng đồng hồ cố định.")
        elif 'enteredField' in observation:
            rows.append(f"Dữ liệu UI thực nhập: {observation['enteredField']} = {observation['enteredValue']}.")
        elif 'enteredDiscount' in observation:
            rows.append(f"Dữ liệu UI thực nhập: giảm giá {observation['enteredDiscount']}%, phụ phí {observation['extraCharge']}.")
        elif 'invalidPaymentRequests' in observation:
            rows.append(f"Số request thanh toán sau dữ liệu không hợp lệ: {observation['invalidPaymentRequests']}; "
                        f"GET lại: trạng thái {observation.get('status')}, thành tiền {observation.get('finalAmount')}, thực thu {observation.get('amountPaid')}.")
        elif 'screenshotPending' in observation:
            pass
        else:
            rows.append(json.dumps({k: v for k, v in observation.items() if k != 'observedAt'}, ensure_ascii=False))
    if actual.get('error'):
        rows.append('ASSERTION FAIL: ' + json.dumps(actual['error'], ensure_ascii=False))
    if not rows:
        rows.append('Không có kết quả nghiệp vụ; xem lỗi runner. Không suy diễn Pass từ code.')
    if status == 'Blocked': rows.append('Giới hạn xác minh: ' + scope)
    proof = {'caseId': case_id, 'executionMethod': 'Cypress UI + API' if case_id in ui_cases else 'Cypress API trực tiếp',
             'runId': report['runId'], 'commit': report['commit'], 'workingTreeHash': report['workingTreeHash'],
             'nativeStatus': result['status'], 'assessedStatus': status, 'scope': scope,
             'expected': item['Expected'], 'observations': observations, 'error': actual.get('error')}
    record_path = evidence / f'{case_id}-observed.json'
    record_path.write_text(json.dumps(proof, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    links = [f'evidence/{record_path.name}']
    for image in (run / 'ui/screenshots').rglob('*.png'):
        if case_id in image.name:
            target = evidence / f'{case_id}-{len(links):02d}-ui.png'
            image_source = '\\\\?\\' + str(image.resolve()) if os.name == 'nt' else str(image)
            shutil.copy2(image_source, target)
            links.append('evidence/' + target.name)
    timing = [observation.get('observedAt') for observation in observations if observation.get('observedAt')]
    bug = item.get('Bug ID') or ''
    if status == 'Fail' and not bug:
        bug = 'Cần phân loại lỗi từ kết quả thực tế'
    row = {key: '' for key in columns}
    row.update({'Run ID': report['runId'], 'Build commit': report['commit'],
                'Executed at': timing[0] if timing else report['started'], 'Executor': 'Codex - hỗ trợ tự động API/UI',
                'Test Case ID': case_id, 'Priority': item['Priority'], 'Description': item['Description'],
                'Precondition': item['Precondition'], 'Actual data / IDs': json.dumps(fixture_data, ensure_ascii=False) if fixture_data else 'Tài khoản QA theo .env.test; không ghi mật khẩu/token.',
                'Steps': item['Steps'], 'Expected': item['Expected'], 'Actual': '\n'.join(rows), 'Status': status,
                'Bug ID': bug, 'Evidence': '\n'.join(links), 'Hinh thuc xac minh': proof['executionMethod'],
                'Pham vi / gioi han': scope,
                'Anh can bo sung': 'Đã có ảnh UI tự động; có thể bổ sung ảnh manual riêng.' if len(links) > 1 else 'Bằng chứng JSON đã có; ảnh Postman/manual có thể bổ sung sau.'})
    sheet.append([row[key] for key in columns])
    sheet.cell(sheet.max_row, columns.index('Evidence') + 1).hyperlink = links[0]
    sheet.cell(sheet.max_row, columns.index('Evidence') + 1).style = 'Hyperlink'
    fill = {'Pass': 'E2F0D9', 'Fail': 'FCE4D6', 'Blocked': 'FFF2CC'}[status]
    sheet.cell(sheet.max_row, columns.index('Status') + 1).fill = PatternFill('solid', fgColor=fill)
    counts[status] += 1
    exported.append(proof)
sheet.freeze_panes = 'F2'
sheet.auto_filter.ref = sheet.dimensions
for index, key in enumerate(columns, 1):
    sheet.column_dimensions[sheet.cell(1, index).column_letter].width = 65 if key in ['Actual', 'Expected', 'Steps', 'Evidence', 'Pham vi / gioi han'] else 27
for row in sheet:
    for cell in row:
        cell.alignment = Alignment(vertical='top', wrap_text=True)
    if row[0].row > 1:
        sheet.row_dimensions[row[0].row].height = 100
for cell in sheet[1]:
    cell.font = Font(bold=True, color='FFFFFF')
    cell.fill = PatternFill('solid', fgColor='17365D')
manual_status = Counter(row['Status'] for row in cases)
overview.append(['Mục', 'Nội dung'])
for row in [
    ['Loại kết quả', 'Kiểm tra có hỗ trợ tự động API/UI; KHÔNG phải 40 case đã thực thi manual.'],
    ['Kết quả 40 case', json.dumps(dict(counts), ensure_ascii=False)],
    ['Kết quả native runner', json.dumps(report['counts'], ensure_ascii=False)],
    ['Run ID', report['runId']], ['Commit', report['commit']], ['Source fingerprint', report['workingTreeHash']],
    ['Thời gian UTC', report['started'] + ' / ' + report['finished']],
    ['Môi trường', json.dumps(report['environment'], ensure_ascii=False)],
    ['File manual gốc', source.relative_to(root).as_posix()], ['SHA256 file manual gốc', original_hash],
    ['SHA256 công cụ xuất', hashlib.sha256(Path(__file__).read_bytes()).hexdigest()],
    ['Manual do bạn nhập', json.dumps(dict(manual_status), ensure_ascii=False) + '; giữ nguyên sheet Execution, không xác nhận thay bạn.'],
    ['Sheet Execution / Run setup', 'Bản sao dữ liệu bạn đã lưu; evidence tương đối trong sheet gốc vẫn tính từ thư mục manual gốc.'],
    ['Ảnh bổ sung', 'Đặt vào evidence/ cạnh file này; thêm đường dẫn vào dòng case phù hợp. Không ghi mật khẩu/token.'],
    ['TC-APPT-014', 'Blocked cho kỳ vọng đúng thời điểm tuyệt đối; API gần giờ hiện tại đã chạy và có observation.'],
    ['Cách đọc', 'Mở sheet Ket qua ho tro 40 case để xem Actual, Status và bấm Evidence. Pass là assertions đã quan sát, không suy ra từ việc đọc code.'],
]: overview.append(row)
overview.column_dimensions['A'].width = 30
overview.column_dimensions['B'].width = 115
for row in overview:
    for cell in row: cell.alignment = Alignment(wrap_text=True, vertical='top')
    overview.row_dimensions[row[0].row].height = 45
book.active = 1
book.save(output)
reopened = load_workbook(output, read_only=True, data_only=False)
assert [tuple(row) for row in reopened['Execution'].iter_rows(values_only=True)] == manual_before
assert hashlib.sha256(source.read_bytes()).hexdigest() == original_hash
(output.parent / 'assisted-results.json').write_text(json.dumps({'runId': report['runId'], 'counts': dict(counts),
    'manualSource': source.relative_to(root).as_posix(), 'manualOriginalUnchanged': True, 'results': exported}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'output': output.relative_to(root).as_posix(), 'counts': dict(counts), 'manualOriginalUnchanged': True}, ensure_ascii=True))
