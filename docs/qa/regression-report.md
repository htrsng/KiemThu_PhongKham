# Regression report — 13/11/2026

| Nhóm | Kết quả hiện tại | Quyết định |
| --- | --- | --- |
| BUG-001: mất thông báo sai mật khẩu | Cypress ca sai mật khẩu Pass; API trả 401, form giữ lỗi và không lưu token | Giữ Closed theo lịch sử và kiểm tra hiện tại |
| API regression | 26/26 Pass; fixture riêng từng test, cleanup sau test | Smoke/nghiệp vụ trong assertion đạt |
| Cypress | 10/10 Pass, không retry | Luồng UI trong suite đạt trên Electron |
| BUG-002: lùi trạng thái hoàn thành | Fail: HTTP 200 và trạng thái bị lùi | Open, chưa có bản sửa |
| BUG-003: hóa đơn trùng | Fail: 2 hóa đơn thay vì 1 | Open, chặn kết luận sẵn sàng phát hành |
| Manual | 70 Not Run | Chưa có kết quả regression manual |

Không gọi việc tái hiện BUG-002/003 là retest bản sửa. Khi có thay đổi ứng dụng, chạy lại `run-api.js --known-defects`, giữ log trước/sau và revision tương ứng rồi mới đổi trạng thái bug. Suite lỗi đang mở trả exit code 1; suite regression mặc định không bao gồm hai test này và CI hiển thị kết quả chúng riêng.

Lệnh và manifest: [evidence 13/11/2026](evidence/2026-11-13/README.md). Kết quả cũ: [verification 06/11/2026](verification.md). Chưa có dữ liệu để kết luận độ ổn định qua nhiều lần chạy hoặc nhiều trình duyệt.
