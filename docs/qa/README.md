# Chạy và quản lý kiểm thử

Chuẩn bị API/UI theo [README](../../README.md). Fixture chỉ chấp nhận API/MongoDB loopback và DB tên kết thúc `_test`. File `.env.test` được sinh riêng cho QA và bị Git bỏ qua.

## Thực thi

```sh
node testing/scripts/audit-qa.js
node --env-file=testing/.env.test testing/scripts/run-qa.js
```

Có thể lọc `--suite=api` (API + defect regression) hoặc `--suite=ui` (Cypress). Runner tự bỏ biến `ELECTRON_RUN_AS_NODE` khỏi process Cypress nếu terminal IDE có đặt biến này. Để kiểm tra riêng hạ tầng báo cáo/lifecycle: `node --test testing/unit/qa-reporting.test.js`.

Mỗi lần chạy tạo `testing/artifacts/runs/QA-<UTC timestamp>-<random>/`, không dùng lại thư mục cũ. `run.json` ghi ngày giờ, executor (`QA_EXECUTOR` hoặc actor CI), version ứng dụng, commit, working-tree hash và hash nguồn. Các suite vẫn được thử tiếp khi suite trước Fail; cuối run trả exit code 1 nếu có Fail, process error hoặc test tự động Not Run.

| File trong run | Ý nghĩa |
| --- | --- |
| `summary.md` | Kết quả đúng lần chạy, không cộng dồn lịch sử |
| `execution.json` / `.csv` / `.xlsx` | Run ID, date, build, executor, case ID, expected, observed actual, status, bug và evidence |
| `traceability.csv` | Toàn bộ 20 use case / 337 case gốc và inventory 70 focused case; manual và automation tách riêng |
| `api/`, `known-defects/` | TAP, JUnit, JSON events và HTTP observations đã giới hạn trường |
| `ui/` | Kết quả Cypress, HTML/JSON report, screenshots và video |
| `*.log` | Output process đã lọc credential/JWT |

`node testing/scripts/audit-run.js <run-directory>` kiểm tra trạng thái, số lượng, metadata, case ID và các evidence link. `node --env-file=testing/.env.test testing/scripts/publish-run.js <Run-ID>` chọn log/report/ảnh để đưa vào `docs/qa/runs/`, không copy video/HTML lớn và không cho ghi đè run đã công bố. Xem lại ảnh trước khi commit.

## Thiết kế và thực thi manual

[Kết quả kiểm thử gốc](history/manual-execution.xlsx) đã được nhập từ 337 case trong Excel đã test, giữ actual/status, date/build nếu có ghi và evidence tới dòng nguồn. [RTM lịch sử](history/rtm.csv) bao phủ đủ 20 use case. Đây là kết quả lịch sử sử dụng được trong hồ sơ dự án, không bị thay bằng Not Run.

Trong [337 case chuẩn hóa](../../testing/manual/source-cases.csv), `Historical status` là kết quả cũ; `Current status` nói về việc retest thủ công trên build mới. [70 focused case](../../testing/manual/test-cases.csv) hỗ trợ automation, không cộng thành các scenario độc lập. Mapping automation ghi Partial vì không thay cho toàn bộ bước UI/manual.

[Suite manual ưu tiên 40 case](manual-regression.xlsx) có metadata, dữ liệu thực tế, steps/expected/actual/status/bug/evidence và dropdown. Làm theo [hướng dẫn thực thi](manual-regression.md), tạo bản sao riêng cho mỗi run, không chép automation thành manual Pass. [Workbook tổng](test-execution.xlsx) vẫn được giữ riêng. Bốn thiết kế thiếu trường đã hoàn thiện trong bản chuẩn hóa, có truy xuất chỉnh sửa ở [đối chiếu nguồn](source-reconciliation.md).

`node testing/scripts/normalize-sources.js` chuẩn hóa lại CSV và metadata từ Excel gốc. Khi cần workbook trống, chỉ định output rõ ràng, ví dụ `--workbook=testing/artifacts/blank-execution.xlsx`; không ghi đè workbook đã có kết quả manual.

## Dữ liệu và isolation

Mỗi test có doctor/patient/service/shift và ID riêng. Fixture tiền điều kiện có thể được insert trực tiếp; hành vi đang kiểm tra đi qua HTTP hoặc UI. Mutation có GET lại để kiểm tra dữ liệu và side effect. Cleanup chỉ xóa ID thuộc fixture do process sở hữu, không drop DB; tài khoản seed và audit log được giữ lại. Kill cứng có thể để lại dữ liệu tạm trong DB QA.

Cypress bật test isolation, retry = 0, không dùng chờ thời gian cố định và không nuốt exception chung. Luồng check-in và thu tiền thao tác qua selector `data-testid`; giai đoạn bác sĩ điều trị trong E2E dùng API, không được mô tả là UI E2E toàn bộ.

## Bug và CI

[Bug register](bug-report.md) liên kết [registry.json](bugs/registry.json) chứa lifecycle có actor/time/evidence. Công cụ `testing/scripts/defect.js` kiểm tra bước chuyển trạng thái, commit sửa và kết quả Retest trước khi đóng. BUG-002/003/004 đã có bằng chứng trước/sau sửa và Closed sau retest; full regression mới nhất có 53 Pass. Summary CI tách Automation API + UI và Defect regression, không dùng nhãn known defect để bỏ qua Fail.

[GitHub Actions](../../.github/workflows/cypress.yml) chạy audit, unit reporting, build và một full QA run. Không có `continue-on-error` che defect regression. Mọi Fail làm job Fail; step audit run và upload artifact `clinic-qa-evidence` vẫn chạy khi Fail. Green badge không thay thế exit criteria hoặc manual execution.

## Postman

Cài `npm ci --prefix testing/postman`, rồi chạy từ thư mục gốc:

```sh
node --env-file=testing/.env.test testing/scripts/run-postman.js
```

Runner tạo dữ liệu riêng cho toàn collection, truyền tài khoản và token trong bộ nhớ, dọn fixture sau khi chạy. [Bằng chứng Newman thực tế](runs/QA-20261113T124931337Z-ba424a/newman-results.json): 21 request, 46/46 assertions Pass. Chỉ lưu tên request/assertion, HTTP status, thời gian và projection nghiệp vụ; không xuất environment/raw response chứa token. Đây là automation Newman, không phải manual GUI.

Cũng có thể import collection/environment trong `testing/postman/`, chọn **SmileCare QA - Local**, điền tài khoản QA từ `.env.test`. Chuẩn bị ID bệnh nhân/bác sĩ/dịch vụ, ca trực bao phủ giờ hẹn trong 30 phút tới và một invoiceId có sẵn để kiểm tra RBAC. Chạy Authentication → RBAC → Appointments/Check-in → Invoices/Payments; collection tự lưu token và ID mới. Không xuất environment đã có token/password. [API checklist](api-contract.md).
