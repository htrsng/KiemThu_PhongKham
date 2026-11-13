# Thực thi manual regression ưu tiên

[Workbook 40 case](manual-regression.xlsx) gồm 8 Authentication, 6 RBAC, 14 Appointment/Check-in và 12 Payment/Invoice; có BUG-002/003/004. Đây là kế hoạch thực thi mới, **40 Not Run**, chưa phải kết quả manual. Case được chọn từ bộ focused có liên kết nguồn gốc khi phù hợp; không cộng vào 337 case lịch sử.

## Trang cần làm

1. Cài/chạy ứng dụng theo [README](../../README.md#5-hướng-dẫn-chạy-kiểm-thử). Chỉ dùng DB có tên kết thúc `_test`; không dùng dữ liệu bệnh nhân thật. Tài khoản QA lấy từ `.env.test` trên máy, không chụp hoặc commit mật khẩu.
2. **Save As** workbook thành bản riêng, ví dụ `manual-testing/test-execution/manual-runs/MAN-20261113-01/execution.xlsx`. Điền sheet `Run setup`: Run ID, tên người test, giờ/timezone, URL, trình duyệt và commit lấy từ `git rev-parse HEAD`.
3. Chuẩn bị một bác sĩ/dịch vụ và bệnh nhân giả qua UI Admin; ghi ID thực tế từ Network. Tạo ca trực hôm nay bao phủ giờ hẹn. Mỗi ca cần lịch/hóa đơn riêng khi trạng thái hoặc thanh toán khác nhau; không dùng lại hóa đơn đã thanh toán để thử case chưa thanh toán. Dùng giá 100.000đ cho luồng thanh toán cơ bản.
4. Làm từng case theo `Precondition`, `Planned data`, `Steps`. Ghi dữ liệu/ID thực tế vào `Actual data / IDs`. Với trường hợp không có nút tương ứng trên UI, dùng request từ DevTools Network hoặc Postman và ghi rõ đây là thao tác API thủ công. Không tính kết quả Node/Cypress/Newman thành manual Pass.
5. Ghi `Actual` bằng điều quan sát được: thông báo, HTTP status, trạng thái sau tải lại, số hóa đơn, amountPaid/finalAmount/debt. Điền thời gian/người test/build cho dòng đã thực hiện. Chọn Pass khi đã đối chiếu đủ Expected; Fail khi khác; Blocked khi thiếu tiền điều kiện/tính năng và ghi lý do; chưa làm giữ Not Run.
6. Lưu ảnh theo ID case và response liên quan trong cùng thư mục Run ID; dán đường dẫn vào `Evidence`. Ẩn Authorization, token, mật khẩu và dữ liệu cá nhân. Nếu Fail, ghi Bug ID và bước tái hiện; không đổi Expected để khớp Actual.

## Ba luồng cần ưu tiên

| Case | Thao tác và bằng chứng cần giữ |
| --- | --- |
| TC-APPT-021 / BUG-002 | Chuẩn bị lịch đã hoàn thành; PATCH trạng thái Đang điều trị phải 400; GET lại vẫn Đã hoàn thành. Chụp request/response đã ẩn token. |
| TC-APPT-022 / BUG-003 | Hoàn thành lịch đang điều trị, gửi lại cùng request; cả hai có thể 200 theo cơ chế idempotent. GET `/api/invoices?appointmentId=<ID>` phải đúng một hóa đơn. Giữ ID và hai lần gửi. |
| TC-PAY-003 / BUG-004 | Check-in → bắt đầu khám → hoàn thành → UI Lễ tân thu tiền mặt 100.000đ. Tải lại và GET hóa đơn: Đã thanh toán, amountPaid = finalAmount = 100000, debt = 0. |

Các case biên giờ cần ghi giờ hẹn và giờ thao tác; dùng khoảng ngoài biên rõ ràng (31 phút) khi không điều khiển được đồng hồ. Không đánh Pass cho case đòi đúng mốc thời gian nếu chưa đo được. Với RBAC, đăng xuất rồi đăng nhập đúng vai trò; kiểm tra cả menu và HTTP response.

Sau khi hoàn thành, kiểm tra mọi dòng Pass/Fail có Actual, thời gian/build/người thực hiện và evidence. Tổng hợp Pass/Fail/Blocked/Not Run từ chính workbook. Có thể gửi lại workbook và bằng chứng đã làm sạch để cập nhật báo cáo dự án; không cần chạy lại toàn bộ 337 case ngay.
