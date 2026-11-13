# Hướng dẫn QA SmileCare

Ứng dụng trong `client/` và `server/` là đối tượng kiểm thử. Phần QA gồm test design, fixture, automation, bug và báo cáo. Bắt đầu từ [test plan](test-plan.md), [test summary](test-report.md), [API checklist](api-contract.md) hoặc [hướng dẫn demo/CV](portfolio.md).

## Bộ đang duy trì

| Thành phần | Phạm vi |
| --- | --- |
| `testing/manual/test-cases.csv` / `.tsv` | 70 thiết kế, chưa có thực thi manual |
| [RTM](rtm.tsv) | 31 yêu cầu; Designed là ánh xạ thiết kế, có scope Current/Deferred |
| [Workbook](test-execution.xlsx) | Template manual 70 Not Run, không lấy automation điền Pass |
| `testing/api/auth.test.js` | 8 test đăng nhập/phiên |
| `testing/api/authorization-invoice.test.js` | 18 test độc lập: RBAC, appointment/check-in, invoice/payment |
| `testing/api/known-defects.test.js` | 2 ca tái hiện lỗi, Fail khi BUG-002/003 còn mở |
| `testing/e2e/cypress/e2e/` | 5 login và 5 UI role/business test |
| `testing/postman/` | Khám phá/tái hiện API thủ công, chưa có run evidence |
| [Bug register](bug-report.md), [regression report](regression-report.md) | Trạng thái lỗi, bằng chứng và điều kiện retest |

## Chuẩn bị và chạy cục bộ

Cài dependencies theo README gốc. Dùng MongoDB local riêng; không dùng DB triển khai. Tại thư mục gốc:

```sh
node testing/scripts/prepare-env.js
node --env-file=testing/.env.test testing/scripts/seed-test-accounts.js
```

`prepare-env.js` sinh credential ngẫu nhiên, không lấy bí mật triển khai. File `.env.test` bị Git bỏ qua. Seed chỉ chấp nhận MongoDB loopback và DB kết thúc `_test`; tạo Admin, Admin khóa, Doctor, Reception cùng dữ liệu nền, không xóa DB. Chạy lại prepare-env sẽ thay môi trường/tài khoản của lần chạy; lưu công việc QA đang làm trước khi tạo môi trường mới.

Khởi động trong hai terminal tại thư mục gốc:

```sh
node --env-file=testing/.env.test server/server.js
```

```sh
npm --prefix client run dev
```

Chạy kiểm tra và xuất báo cáo:

```sh
node testing/scripts/audit-qa.js
node testing/scripts/wait-for-app.js
node --env-file=testing/.env.test testing/scripts/run-api.js
node --env-file=testing/.env.test testing/scripts/run-api.js --known-defects
```

Suite mặc định trả nonzero nếu regression Fail. Suite `--known-defects` hiện trả 1 do hai lỗi đã xác minh; không ghi là Pass. TAP/JUnit và manifest nằm ở `testing/artifacts/api/` và `testing/artifacts/known-defects/`.

Chạy Cypress từ `testing/e2e`:

```sh
node --env-file=../.env.test node_modules/cypress/bin/cypress run
```

Xem [Cypress README](../../testing/e2e/README.md) nếu dùng npm, chỉ chạy smoke hoặc gặp biến `ELECTRON_RUN_AS_NODE` trong terminal IDE.

## Dữ liệu và isolation

Helper `testing/helpers/qa-data.js` chỉ nhận API/MongoDB loopback và DB `_test`. Mỗi test tạo bác sĩ/bệnh nhân/dịch vụ/ca riêng bằng ObjectId và mã ngẫu nhiên. Appointment/invoice tiền điều kiện có thể được insert trực tiếp để test không phụ thuộc luồng trước; thao tác đang kiểm tra vẫn đi qua HTTP hoặc UI. Test mutation dùng GET lại để xác minh persisted state hoặc không có side effect khi bị từ chối.

Cleanup chỉ xóa theo ID của fixture do chính process sở hữu; không drop database. Hook sau test và cuối suite dọn fixture trong lần chạy bình thường. Nếu process bị kill cứng, dữ liệu tạm có thể còn trong DB QA. Tài khoản nền seed và audit log đăng nhập được giữ lại; không tuyên bố toàn DB sạch sau chạy.

## CI và bằng chứng

Workflow [Clinic QA Checks](../../.github/workflows/cypress.yml) chạy audit/build/API/Cypress. Lỗi regression làm job Fail. Known-defect suite chạy riêng với `continue-on-error: true`, kết quả thật vẫn có trong summary/artifact; đây là quyết định hiển thị lỗi đã biết, không phải release gate. Artifact `clinic-qa-evidence` được upload với `if: always()`.

[Evidence 13/11/2026](evidence/2026-11-13/README.md) là kết quả local. [Verification cũ](verification.md) là CI lịch sử. Chưa có CI run mới được xác nhận cho working tree hiện tại. Không suy ra toàn bộ hệ thống đạt từ badge xanh.

Chỉ chọn log/ảnh an toàn vào repo; không commit credential hoặc token. Lịch sử Git từng có cấu hình Atlas; nếu credential cũ còn hoạt động, chủ tài khoản cần thay tại nhà cung cấp. Tài liệu và dữ liệu ngẫu nhiên trong `archive/` không phải bằng chứng thực thi.
