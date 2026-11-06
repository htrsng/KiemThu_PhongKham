# Kết quả xác minh

Ngày thực hiện: 06/11/2026.

- Đã kiểm tra cú pháp các script chuẩn bị môi trường, seed tài khoản, chờ ứng dụng và API tests bằng Node.js.
- Bộ hiện tại khai báo 8 kiểm tra API và 5 kiểm tra Cypress cho đăng nhập.
- Việc cài Cypress cục bộ bị chặn ở bước giải nén do gói tải về không hợp lệ. MongoDB cục bộ qua môi trường hỗ trợ cũng không khởi động được. Chưa coi đó là kết quả thực thi test.
- Build frontend bằng `npm run build --prefix client` đã đạt sau khi sửa import không dùng và kiểu formatter của biểu đồ.
- Lần CI đầu: 8/8 API đạt, Cypress 4/5 đạt. Ca sai mật khẩu phát hiện form mất thông báo do interceptor HTTP 401 tải lại trang.
- Đã sửa phân biệt lỗi đăng nhập với phiên hết hạn; giữ nguyên ca Cypress, chờ CI xác minh lại.

Bộ cũ được lưu tại `testing/e2e/cypress/legacy/`; tài liệu và bộ sinh được lưu tại `docs/qa/archive/`. Nội dung tài liệu cũ không được diễn giải thành bằng chứng chạy hiện tại.

`server/.env` đã bị bỏ khỏi Git theo dõi, nhưng việc này không xóa bản đã có trong lịch sử Git. Thông tin xác thực từng dùng thật trong file đó cần được thay mới bởi chủ tài khoản.
