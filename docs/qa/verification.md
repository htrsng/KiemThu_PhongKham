# Kết quả xác minh ngày 06/11/2026

## Kết quả trên GitHub Actions

[Workflow xác minh thành công](https://github.com/htrsng/KiemThu_PhongKham/actions/runs/42179238371), commit `6946c09bde0ce5c45c27e9879c056da9a29bba99`.

| Kiểm tra | Kết quả |
| --- | --- |
| Cài thư viện backend, frontend và Cypress | Đạt |
| Build giao diện React/TypeScript | Đạt |
| Chuẩn bị tài khoản trên MongoDB thử nghiệm riêng | Đạt |
| API đăng nhập và phiên | 8/8 đạt |
| Cypress giao diện đăng nhập | 5/5 đạt |

Môi trường CI: Ubuntu, Node.js 24, MongoDB 7 trong dịch vụ riêng của workflow, Cypress 15.17 chạy Electron headless. Mật khẩu và khóa JWT được sinh mới cho mỗi job, không lấy thông tin triển khai thật. Bộ kiểm thử cũ không được chọn chạy trong lần xác minh này.

Báo cáo, ảnh lỗi (nếu có), video và log nằm trong artifact `clinic-qa-evidence` của workflow. Đây là kết quả thực thi, không lấy trạng thái từ các bộ sinh tài liệu.

## Lỗi đã phát hiện và sửa

Lần CI đầu: API 8/8 đạt, Cypress 4/5 đạt. Ca sai mật khẩu phát hiện interceptor HTTP 401 tải lại trang, làm mất thông báo lỗi. Đã sửa để yêu cầu đăng nhập trả lỗi về form; giữ nguyên assertion và chạy lại đạt 5/5.

Xem [mô tả hồi quy](./login-error-regression.md) và [phạm vi kiểm thử](./test-plan.md).

## Kiểm tra cục bộ và giới hạn

Build frontend và kiểm tra cú pháp các script Node đã đạt. Việc chạy MongoDB/Cypress cục bộ trong môi trường hỗ trợ gặp giới hạn khởi động/tải gói, nên các kiểm tra tích hợp được xác minh trên GitHub Actions.

Bộ hiện tại chỉ tập trung vào đăng nhập và phiên. Kết quả không xác nhận đầy đủ lịch khám, thanh toán, phân quyền mọi tài nguyên, tiền lương, bảo mật hay hiệu năng của toàn ứng dụng.

Tài liệu và bộ sinh cũ được lưu tại `docs/qa/archive/`; các kịch bản chưa hoàn thiện ở `testing/e2e/cypress/legacy/`. Không tính chúng vào số ca đã xác minh.

## Cấu hình cục bộ

`server/.env` đã bị bỏ khỏi Git theo dõi, nhưng bản đã có vẫn nằm trong lịch sử Git. Chủ tài khoản cần thay mới thông tin xác thực từng dùng thật trong file này. Không đưa `.env` hay `testing/.env.test` vào Git hoặc báo cáo công khai.
