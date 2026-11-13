# Test scenarios

Các scenario dưới đây nhóm các thiết kế đã có; không tạo thêm số lượng case hoặc kết quả thực thi. Đối chiếu chi tiết trong [70 focused cases](../test-cases/test-cases.csv), [337 case nguồn](../test-cases/source-cases.csv) và [RTM](../rtm/rtm.tsv).

| Scenario | Phạm vi / điều kiện chính | Focused case liên quan |
| --- | --- | --- |
| SC-AUTH-01 | Đăng nhập hợp lệ, email/mật khẩu sai hoặc thiếu, tài khoản khóa | TC-AUTH-001–008 |
| SC-AUTH-02 | Token thiếu/hết hạn, đăng xuất và bảo vệ phiên | TC-AUTH-009–012 |
| SC-RBAC-01 | Admin/Doctor/Reception truy cập chức năng theo vai trò | TC-AUTHZ-001–012 |
| SC-APPT-01 | Đặt lịch hợp lệ, quá khứ, ngoài ca/nghỉ phép | TC-APPT-001–006 |
| SC-APPT-02 | Sức chứa ca, đặt trùng và lịch đã hủy | TC-APPT-007–010 |
| SC-APPT-03 | Check-in theo khoảng giờ, ghi thời gian và từ chối lặp | TC-APPT-011–015 |
| SC-APPT-04 | Chuyển trạng thái hợp lệ, hủy/lùi sai; hoàn thành idempotent | TC-APPT-016–022; BUG-002/003 |
| SC-APPT-05 | Khách vãng lai và dữ liệu lịch hẹn thiếu/không hợp lệ | TC-APPT-023–026 |
| SC-PAY-01 | Tạo/xem hóa đơn, bốn phương thức thanh toán, số tiền thực thu | TC-PAY-001–006; BUG-004 |
| SC-PAY-02 | Thiếu tiền, ghi nợ và số tiền âm | TC-PAY-007–010 |
| SC-PAY-03 | Giảm giá/phụ phí, biên tổng tiền và validation UI | TC-PAY-011–017 |
| SC-PAY-04 | Hoàn tiền và quyền xóa hóa đơn thử | TC-PAY-018–020 |

Phạm vi ưu tiên thực thi thủ công là [40 case](../test-cases/regression-suite.csv), không phải toàn bộ scenario đã retest. Các use case doanh thu/payroll và tính năng chỉ có trong đặc tả tiếp tục được truy vết ở [RTM lịch sử](../rtm/historical-rtm.csv); không tự đánh Covered/Pass trên build hiện tại.
