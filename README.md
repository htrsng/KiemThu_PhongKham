# SmileCare — Quản lý phòng khám nha khoa

Dự án học tập xây dựng ứng dụng quản lý phòng khám: tài khoản, bác sĩ, dịch vụ, lịch khám, tiếp đón, thanh toán và tiền lương. Kho mã gồm giao diện React/TypeScript, API Express/MongoDB, tài liệu kiểm thử thủ công và bộ kiểm thử Cypress.

## Cấu trúc

| Thư mục | Nội dung |
| --- | --- |
| `client/` | Giao diện React, TypeScript và Vite |
| `server/` | API Express và mô hình MongoDB |
| `testing/api/` | Kiểm tra API đăng nhập bằng Node.js |
| `testing/e2e/` | Cypress: kiểm tra hiện tại và các kịch bản cũ tách riêng |
| `testing/scripts/` | Sinh môi trường QA, tạo tài khoản thử nghiệm, chờ ứng dụng |
| `docs/qa/` | Kế hoạch kiểm thử, hướng dẫn và kết quả xác minh |
| `docs/qa/archive/` | Tài liệu, bộ sinh và dữ liệu kiểm thử học tập cũ |
| `scripts/`, `patches/` | Công cụ bảo trì; đọc mã trước khi chạy |

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

## Kiểm thử

Đọc [hướng dẫn QA](./docs/qa/README.md) và [kế hoạch hiện tại](./docs/qa/test-plan.md). Bộ kiểm tra hiện tại gồm 8 ca API đăng nhập và 5 ca giao diện đăng nhập. Số ca này mô tả phạm vi bộ kiểm thử, không phải độ bao phủ toàn bộ phòng khám.

Workflow **Clinic QA Checks** dùng MongoDB riêng, sinh tài khoản và mật khẩu tạm thời, kiểm tra API và chạy Cypress. Kết quả xác minh được ghi ở [verification.md](./docs/qa/verification.md).

## Tài liệu và kiểm thử cũ

Các kịch bản trước đây dùng bộ chọn và đường dẫn chưa khớp giao diện hiện tại, một số chỉ là khung. Chúng được giữ tại `testing/e2e/cypress/legacy/`, không tính như chức năng đã xác minh và không chạy mặc định. Có thể chọn chạy thêm qua workflow thủ công để tiếp tục hoàn thiện.

Một số bộ sinh trong `docs/qa/archive/` gán ngẫu nhiên trạng thái Pass/Fail/Blocked, người kiểm thử và ngày chạy. Đó là dữ liệu tổng hợp, **không phải kết quả thực thi**; không dùng làm số lỗi hoặc số ca đã chạy trong CV.

## Giới hạn

Bộ kiểm thử hiện tại tập trung vào đăng nhập. Lịch khám, thanh toán, phân quyền theo từng tài nguyên và tính lương chưa được xác nhận đầy đủ bằng bộ kiểm thử này. Không dùng dữ liệu thật khi thử các seed hoặc script bảo trì cũ; một số script có lệnh xóa dữ liệu.

Tài liệu đang duy trì dùng tiếng Việt; tên file và mã nguồn dùng tiếng Anh theo quy ước từng ngôn ngữ. Xem [CONTRIBUTING.md](./CONTRIBUTING.md).
