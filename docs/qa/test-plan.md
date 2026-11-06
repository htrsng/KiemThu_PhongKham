# Kế hoạch kiểm thử đăng nhập

## Điều kiện

MongoDB cục bộ riêng, hai tài khoản tổng hợp Admin: một active, một locked; mật khẩu sinh mới cho môi trường. API ở cổng 5000, giao diện ở cổng 5173. Không chạy trên DB thật.

## API — 8 ca

| Trường hợp | Kỳ vọng |
| --- | --- |
| Thiếu trường đăng nhập | HTTP 400 |
| Email không thuộc gmail.com | HTTP 400, invalid_email_format |
| Sai mật khẩu | HTTP 401, wrong_password |
| Tài khoản đã khóa | HTTP 403, locked |
| Đăng nhập đúng | HTTP 200, có token, không trả mật khẩu |
| /me không có token | HTTP 401 |
| /me có token đúng | HTTP 200, đúng tài khoản, không trả mật khẩu |
| /me có token sai | HTTP 401 |

## Giao diện — 5 ca

1. Truy cập trang được bảo vệ khi chưa đăng nhập chuyển về /login.
2. Thiếu email/mật khẩu: trình duyệt báo trường bắt buộc.
3. Email không thuộc gmail.com: hiển thị lỗi nghiệp vụ.
4. Sai mật khẩu: phản hồi API 401, thông báo lỗi, không lưu phiên.
5. Đúng thông tin: về trang chính, lưu phiên và xác minh bằng API /me.

## Ngoài phạm vi

Chưa kết luận về khóa tài khoản sau nhiều lần sai, tạo lịch, thanh toán, lương, bảo mật tổng thể, hiệu năng hoặc độ bao phủ tất cả chức năng. Không tính test rỗng hoặc chỉ mở trang vào phạm vi đã xác minh.
