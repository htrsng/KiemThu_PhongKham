# Hồi quy: mất thông báo khi sai mật khẩu

## Quan sát

Ở lần chạy CI đầu ngày 06/11/2026, API trả HTTP 401 và `wrong_password` đúng kỳ vọng, nhưng giao diện không giữ thông báo lỗi. Cypress thất bại ở bước tìm `auth-error`; bốn ca giao diện khác và tám ca API đạt.

Bằng chứng gốc: [workflow 42178677113](https://github.com/htrsng/KiemThu_PhongKham/actions/runs/42178677113).

## Tái hiện

1. Chuẩn bị tài khoản active trong DB thử nghiệm theo hướng dẫn QA.
2. Mở /login, nhập email tài khoản và mật khẩu sai.
3. Gửi biểu mẫu.

Kỳ vọng: hiển thị email hoặc mật khẩu không chính xác, không lưu phiên.

Trước sửa: interceptor coi mọi HTTP 401 là phiên hết hạn và đặt `window.location.href`, làm trang tải lại và mất trạng thái lỗi.

## Thay đổi

Không tự chuyển trang đối với HTTP 401 từ yêu cầu đăng nhập/đăng ký. Lỗi được trả về form để xử lý. HTTP 401 của các tài nguyên được bảo vệ vẫn xử lý như trước.

Ca hồi quy: `testing/e2e/cypress/e2e/login.cy.js`, trường hợp “Từ chối mật khẩu sai và không lưu phiên đăng nhập”. Không bỏ assertion và không giả phản hồi API để làm test đạt.

Sau sửa: CI xác nhận 8/8 API và 5/5 Cypress đạt. Xem `verification.md` để đối chiếu lần chạy và phạm vi.
