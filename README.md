# SmileCare — Tester Intern Portfolio

[![Clinic QA Checks](https://github.com/htrsng/KiemThu_PhongKham/actions/workflows/cypress.yml/badge.svg)](https://github.com/htrsng/KiemThu_PhongKham/actions/workflows/cypress.yml)

Dự án kiểm thử ứng dụng quản lý phòng khám nha khoa, tập trung vào **đăng nhập, phân quyền, lịch hẹn/check-in và thanh toán/hóa đơn**. Mục tiêu là thể hiện quy trình của một intern tester: phân tích yêu cầu, thiết kế test theo rủi ro, kiểm tra API/UI, báo lỗi có thể tái hiện và báo cáo kết quả có bằng chứng.

`client/` (React/TypeScript) và `server/` (Express/MongoDB) là ứng dụng được kiểm thử. Phần portfolio QA nằm ở `testing/` và `docs/qa/`. Đây là dự án học tập cá nhân; việc dùng AI hỗ trợ và phạm vi trách nhiệm được nêu trong [hồ sơ dự án](docs/qa/portfolio.md).

## Xem dự án trong 3 phút

1. [Test plan](docs/qa/test-plan.md): phạm vi, rủi ro, entry/exit criteria và kỹ thuật thiết kế.
2. [70 test case](testing/manual/test-cases.csv) · [RTM](docs/qa/rtm.tsv): 31 yêu cầu được ánh xạ tới thiết kế test; có phân biệt phạm vi hiện tại và hoãn lại.
3. [Bug reports](docs/qa/bug-report.md): một lỗi đăng nhập đã đóng theo bằng chứng lịch sử và hai lỗi nghiệp vụ tái hiện được.
4. [Test summary](docs/qa/test-report.md) · [log và ảnh thực tế](docs/qa/evidence/2026-11-13/README.md).
5. [Nội dung CV và hướng dẫn demo](docs/qa/portfolio.md).

## Kết quả xác minh cục bộ — 13/11/2026

| Hạng mục | Kết quả | Bằng chứng |
| --- | --- | --- |
| Thiết kế manual | 70 case; **chưa ghi nhận thực thi manual** | [CSV](testing/manual/test-cases.csv), [Excel execution](docs/qa/test-execution.xlsx) |
| API regression | **26 Pass, 0 Fail** | [TAP](docs/qa/evidence/2026-11-13/api-results.tap), [JUnit](docs/qa/evidence/2026-11-13/api-junit.xml) |
| Cypress UI | **10 Pass, 0 Fail**, retry = 0 | [Kết quả](docs/qa/evidence/2026-11-13/cypress-results.json) |
| Ca tái hiện lỗi đang mở | **2 Fail / 2 test**, báo riêng khỏi regression | [Log lỗi](docs/qa/evidence/2026-11-13/known-defects-results.tap) |
| Frontend production build | Pass | [Ghi nhận môi trường và lệnh](docs/qa/evidence/2026-11-13/README.md) |

Tổng lần chạy hiện tại: **38 test tự động, 36 Pass và 2 Fail do lỗi đang mở**. Không tính 70 case thiết kế hoặc dữ liệu trong `archive/` thành test đã Pass. Kết quả cục bộ không thay thế kết quả GitHub Actions; badge phía trên thể hiện trạng thái CI riêng.

![Reception check-in: UI đã chuyển trạng thái và API xác nhận dữ liệu](docs/qa/evidence/2026-11-13/reception-checkin-persisted.png)

## Năng lực QA được thể hiện

- Thiết kế theo Equivalence Partitioning, Boundary Value Analysis, State Transition, Decision Table và RBAC.
- API positive/negative/authorization; kiểm tra HTTP status, response và dữ liệu đọc lại sau thao tác.
- Cypress đăng nhập, menu theo vai trò, check-in thật qua UI và hiển thị hóa đơn; mỗi test tự chuẩn bị dữ liệu.
- Bug report có bước tái hiện, expected/actual, severity/priority, nguyên nhân nghi vấn và regression test.
- CI lưu TAP/JUnit, HTML report, video, screenshot và log; các lỗi đã biết được báo riêng, không biến thành Pass.

## Chạy lại

Yêu cầu Node.js 24, npm và MongoDB cục bộ. Lần xác minh cục bộ dùng Node.js 22.15.0; CI cấu hình Node.js 24. Không cần tài khoản dịch vụ bên ngoài.

```sh
npm ci --prefix server
npm ci --prefix client
npm ci --prefix testing/e2e
node testing/scripts/prepare-env.js
node --env-file=testing/.env.test testing/scripts/seed-test-accounts.js
```

Mở hai terminal tại thư mục gốc:

```sh
node --env-file=testing/.env.test server/server.js
```

```sh
npm --prefix client run dev
```

Sau khi API ở cổng 5000 và giao diện ở 5173 sẵn sàng:

```sh
node testing/scripts/audit-qa.js
node testing/scripts/wait-for-app.js
node --env-file=testing/.env.test testing/scripts/run-api.js
```

Cypress chạy từ `testing/e2e/`:

```sh
cd testing/e2e
node --env-file=../.env.test node_modules/cypress/bin/cypress run
```

Từ thư mục gốc, tái hiện hai lỗi đang mở (lệnh trả exit code 1 khi lỗi còn tồn tại):

```sh
node --env-file=testing/.env.test testing/scripts/run-api.js --known-defects
```

Xem [hướng dẫn môi trường](docs/qa/README.md), [Cypress](testing/e2e/README.md), [API contract](docs/qa/api-contract.md) và [Postman](testing/postman/README.md) để biết dữ liệu, endpoint và cách đọc báo cáo.

## Cấu trúc

| Thư mục | Vai trò |
| --- | --- |
| `testing/manual/` | Thiết kế test CSV/TSV đồng nhất |
| `testing/api/` | API regression và ca tái hiện lỗi |
| `testing/e2e/` | Cypress UI và báo cáo HTML |
| `testing/helpers/`, `testing/scripts/` | Fixture riêng từng test, cleanup, xuất và kiểm tra báo cáo |
| `testing/postman/` | Collection phục vụ khám phá và tái hiện thủ công |
| `docs/qa/` | Test plan, RTM, workbook manual, bug và kết quả |
| `client/`, `server/` | Ứng dụng được kiểm thử |
| `app-maintenance/`, `docs/qa/archive/` | Công cụ và dữ liệu lịch sử, không tính vào kết quả QA |

## Giới hạn

Chưa đạt exit criteria để kết luận sẵn sàng phát hành: còn hai lỗi nghiệp vụ mở và manual chưa thực thi. Tính lương, dashboard, hiệu năng, pentest và tương thích nhiều trình duyệt chưa được xác minh trong lần chạy này. Postman là bộ hỗ trợ kiểm tra thủ công, chưa có kết quả collection runner được ghi nhận.

Không commit `.env`, token, mật khẩu hoặc dữ liệu bệnh nhân thật. Đọc [quy ước đóng góp](CONTRIBUTING.md) trước khi thay đổi dữ liệu hoặc thêm kết quả kiểm thử.
