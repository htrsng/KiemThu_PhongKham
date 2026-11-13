# Bộ test case thủ công

`test-cases.csv` là bản CSV chính để mở bằng Excel; `test-cases.tsv` là bản TSV
tương đương để import vào Google Sheets hoặc các công cụ xử lý bảng.

Các cột gồm:

`ID`, `Module`, `Description`, `Precondition`, `Test data`, `Steps`, `Expected`, `Priority`, `Type`, `Technique`.

Credential và dữ liệu định danh trong test data là placeholder. Khi chạy, thay bằng dữ liệu được sinh trong môi trường QA; không ghi mật khẩu thật vào file này.

Workbook [test-execution.xlsx](../../docs/qa/test-execution.xlsx) dành riêng cho thực thi manual, có 70 dòng `Not Run`, dropdown Pass/Fail/Blocked/Not Run, cột revision, actual, bug và evidence. Tạo bản sao sheet cho từng run; không chuyển kết quả API/Cypress thành manual Pass.

RTM có 31 yêu cầu: 30 thuộc phạm vi hiện tại, 1 về payroll hoãn lại (2 case). `Coverage = Designed` chỉ nghĩa là có thiết kế; không xác nhận requirement đã Pass. Biên chính xác ±30 phút cần kiểm soát clock backend; thao tác tay qua mạng không chứng minh được đúng mốc mili giây.

Chạy `node testing/scripts/audit-qa.js` để kiểm tra ID, trường bắt buộc và ánh xạ. Tạo lại workbook trống khi cần: cài `testing/requirements-docs.txt` rồi chạy `python testing/scripts/build-execution-workbook.py`. Lệnh này tạo lại file mẫu, vì vậy lưu riêng workbook đã điền kết quả trước khi chạy.
