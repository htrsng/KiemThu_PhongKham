# Hướng dẫn kiểm thử

Cài đặt, tạo môi trường và khởi động ứng dụng theo [README](../../README.md). Bộ QA chỉ dùng API/MongoDB loopback và database có tên kết thúc `_test`.

## Các bộ kiểm thử

| Bộ | Nội dung |
| --- | --- |
| `testing/api/auth.test.js` | 8 test đăng nhập và phiên |
| `testing/api/authorization-invoice.test.js` | 18 test phân quyền, lịch hẹn, check-in và hóa đơn |
| `testing/api/known-defects.test.js` | 2 test tái hiện BUG-002 và BUG-003 |
| `testing/e2e/cypress/e2e/` | 5 test đăng nhập và 5 test vai trò/nghiệp vụ UI |
| [Manual cases](../../testing/manual/test-cases.csv) | 70 thiết kế; [workbook](test-execution.xlsx) để ghi actual, status, bug và evidence |
| [RTM](rtm.tsv) | 31 yêu cầu: 30 Current, 1 Deferred về payroll; Designed không có nghĩa đã Pass |

## Chạy và đọc kết quả

Từ thư mục gốc, sau khi API/UI sẵn sàng:

```sh
node testing/scripts/audit-qa.js
node --env-file=testing/.env.test testing/scripts/run-api.js
node --env-file=testing/.env.test testing/scripts/run-api.js --known-defects
```

Suite regression trả nonzero khi có test Fail. Suite `--known-defects` hiện trả exit code 1 do hai lỗi mở; không tính chúng vào Pass. TAP/JUnit và manifest nằm ở `testing/artifacts/api/` và `testing/artifacts/known-defects/`.

Cypress chạy tại `testing/e2e`:

```sh
node --env-file=../.env.test node_modules/cypress/bin/cypress run
node --env-file=../.env.test node_modules/cypress/bin/cypress run --spec cypress/e2e/login.cy.js
```

HTML/JSON ở `cypress/reports/`, ảnh ở `cypress/screenshots/`, video ở `cypress/videos/`. Nếu terminal IDE có `ELECTRON_RUN_AS_NODE=1`, bỏ biến này trước khi chạy Cypress; với PowerShell dùng `Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue`.

Fixture tạo bác sĩ, bệnh nhân, dịch vụ và ca riêng cho từng test; thao tác được kiểm tra đi qua API/UI và được GET lại để xác minh dữ liệu. Hook cleanup chỉ xóa ID do helper sở hữu, không drop DB. Tài khoản seed và audit log được giữ lại; process bị kill cứng có thể để lại fixture tạm.

## Postman

Import collection và environment trong `testing/postman/`, chọn **SmileCare QA - Local**. Điền tài khoản QA tương ứng từ `testing/.env.test`; không xuất environment đã có mật khẩu/token.

Chạy Authentication → RBAC → Appointments and Check-in → Invoices and Payments. Với request tạo lịch, điền `patientId`, `doctorId`, `serviceId`, `futureStartTime`, `futureEndTime` từ DB QA có ca trực phù hợp. Collection lưu token và ID tạo mới trong environment. Chưa có kết quả Postman runner được ghi nhận; ngưỡng response time 1500 ms chỉ là assertion của collection, không phải kết luận hiệu năng.

## CI và bằng chứng

[Workflow](../../.github/workflows/cypress.yml) chạy audit, build, API và Cypress. Regression Fail làm job Fail; suite lỗi đã biết chạy riêng, non-blocking, kết quả vẫn được ghi vào summary và artifact `clinic-qa-evidence`. Artifact được upload kể cả khi test Fail.

[Test report](test-report.md) ghi phạm vi và giới hạn; [evidence](evidence/2026-11-13/README.md) chứa log và ảnh lần chạy cục bộ. Workbook manual bắt đầu với 70 Not Run, chỉ cập nhật khi thực hiện từng bước thật. Quy ước đóng góp ở [CONTRIBUTING](../../CONTRIBUTING.md).
