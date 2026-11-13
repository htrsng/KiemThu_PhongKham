# SmileCare — Quản lý phòng khám nha khoa

[![Clinic QA Checks](https://github.com/htrsng/KiemThu_PhongKham/actions/workflows/cypress.yml/badge.svg)](https://github.com/htrsng/KiemThu_PhongKham/actions/workflows/cypress.yml)

## QA at a glance

| Chỉ số | Giá trị |
| --- | --- |
| Test case thiết kế | 70 |
| Test tự động trong repo | 35 (18 API, 17 Cypress) |
| Runtime test đã có bằng chứng | 13 Pass |
| Bug đã ghi nhận | 1 Closed, 0 Open |
| CI | [Clinic QA Checks](https://github.com/htrsng/KiemThu_PhongKham/actions/workflows/cypress.yml) |
| Báo cáo | [Test report](./docs/qa/test-report.md) · [Bug report](./docs/qa/bug-report.md) |

Dự án QA cho ứng dụng quản lý phòng khám SmileCare: tài khoản, bác sĩ, dịch vụ, lịch khám, tiếp đón, thanh toán và tiền lương. Kho mã gồm giao diện React/TypeScript, API Express/MongoDB, tài liệu kiểm thử thủ công và bộ kiểm thử tự động.

Ứng dụng trong `client/` và `server/` là đối tượng được kiểm thử. Phần QA do mình thực hiện nằm ở `testing/` và `docs/qa/`; phạm vi và trạng thái xác minh được ghi riêng, không coi mã ứng dụng là mã QA.

## Cấu trúc

| Thư mục | Nội dung |
| --- | --- |
| `client/` | Giao diện React, TypeScript và Vite |
| `server/` | API Express và mô hình MongoDB |
| `testing/api/` | Kiểm thử API tự động bằng Node.js, chạy được trên CI |
| `testing/postman/` | Khám phá/điều tra API thủ công bằng Postman |
| `testing/e2e/` | Cypress: kiểm tra UI và workflow hiện tại |
| `testing/scripts/` | Sinh môi trường QA, tạo tài khoản thử nghiệm, chờ ứng dụng |
| `docs/qa/` | Kế hoạch kiểm thử, báo cáo, bug và bằng chứng QA |
| `docs/qa/bugs/` | Mỗi bug một file, kèm trạng thái và liên kết bằng chứng |
| `docs/qa/evidence/` | Hướng dẫn lưu ảnh chụp, log và kết quả chạy |
| `docs/qa/archive/` | Tài liệu, bộ sinh và dữ liệu kiểm thử học tập cũ |
| `app-maintenance/` | Công cụ bảo trì ứng dụng, không thuộc phạm vi QA |

## Chạy ứng dụng

Yêu cầu Node.js 24, npm và MongoDB. Sao chép `server/.env.example` thành `server/.env`, đặt URI MongoDB và khóa JWT của môi trường cục bộ. Không đưa file `.env` lên Git.

Từ thư mục gốc, cài thư viện:

```sh
npm ci --prefix server
npm ci --prefix client
npm ci --prefix testing/e2e
```

Mở hai cửa sổ lệnh:

```sh
cd server
npm start
```

```sh
cd client
npm run dev
```

API mặc định ở cổng 5000, giao diện ở cổng 5173. `npm run build --prefix client` biên dịch bản giao diện.

## Kiểm thử và báo cáo

Đọc [hướng dẫn QA](./docs/qa/README.md), [quy ước QA](./docs/qa/conventions.md) và [kế hoạch kiểm thử](./docs/qa/test-plan.md). Bộ QA gồm 18 ca API, 17 ca Cypress và 70 test case thiết kế cho bốn module ưu tiên. Đây là số lượng trong bộ kiểm thử, không phải độ bao phủ toàn bộ phòng khám.

| Tài liệu | Nội dung |
| --- | --- |
| [Test plan](./docs/qa/test-plan.md) | Phạm vi, rủi ro, môi trường và chiến lược |
| [Test cases CSV](./testing/manual/test-cases.csv) · [TSV](./testing/manual/test-cases.tsv) | 70 test case thủ công, mở được bằng Excel |
| [RTM](./docs/qa/rtm.tsv) | Ánh xạ 27 yêu cầu tới test case |
| [Bug report](./docs/qa/bug-report.md) | Lỗi đã phát hiện, trạng thái và bằng chứng |
| [Test report](./docs/qa/test-report.md) | Kết quả thực thi đã xác minh |
| [Verification log](./docs/qa/verification.md) | Chi tiết lần chạy CI và giới hạn |

Workflow **Clinic QA Checks** dùng MongoDB riêng, sinh tài khoản và mật khẩu tạm thời, kiểm tra API và chạy Cypress. Báo cáo, log, ảnh và video khi lỗi được lưu trong artifact `clinic-qa-evidence` của workflow.

## Tài liệu và kiểm thử cũ

Các kịch bản Cypress legacy trước đây dùng bộ chọn và đường dẫn chưa khớp giao diện hiện tại, một số chỉ là khung. Thư mục `testing/e2e/cypress/legacy/` đã được xóa; chỉ các spec hiện tại trong `testing/e2e/cypress/e2e/` được tính vào bộ QA.

Một số bộ sinh trong `docs/qa/archive/` gán ngẫu nhiên trạng thái Pass/Fail/Blocked, người kiểm thử và ngày chạy. Đó là dữ liệu tổng hợp, **không phải kết quả thực thi**; không dùng làm số lỗi hoặc số ca đã chạy trong CV.

## Giới hạn

Bộ QA ưu tiên đăng nhập, phân quyền, lịch hẹn/check-in và thanh toán/hóa đơn. Các module lương, dashboard/thống kê, nhắn tin mô phỏng, hiệu năng và kiểm thử thâm nhập nằm ngoài phạm vi hiện tại. Không dùng dữ liệu thật khi thử các seed hoặc công cụ trong [app-maintenance/](./app-maintenance/); một số công cụ có thể sửa hoặc xóa dữ liệu.

Tài liệu đang duy trì dùng tiếng Việt; tên file và mã nguồn dùng tiếng Anh theo quy ước từng ngôn ngữ. Xem [CONTRIBUTING.md](./CONTRIBUTING.md).
