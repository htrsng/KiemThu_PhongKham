# App maintenance tools

Các file trong thư mục này là công cụ bảo trì, vá hoặc mô phỏng cho ứng dụng.
Chúng **không thuộc phạm vi QA**, không được CI QA gọi và không được tính là test.

Đọc mã và kiểm tra biến môi trường trước khi chạy. Không chạy trên database thật:
một số script cũ có thể sửa hoặc xóa dữ liệu. Ưu tiên bản sao hoặc database local
riêng cho thao tác thử nghiệm.
