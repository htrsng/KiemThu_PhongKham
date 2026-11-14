# Kết quả kiểm tra 40 case có hỗ trợ tự động

Mở [file Excel đã điền](QA-20261114T151532131Z-c5d60f/manual-regression-results.xlsx), sheet **Ket qua ho tro 40 case**.

| Loại hồ sơ | Kết quả | Cách hiểu |
| --- | --- | --- |
| Đánh giá 40 dòng trong Excel | 38 Pass / 1 Fail / 1 Blocked | Kết quả assertions API/UI thực tế có ghi giới hạn xác minh |
| Cypress native cùng run | 39 Pass / 1 Fail | TC-APPT-014 kiểm tra HTTP gần giờ hiện tại Pass; Excel giữ Blocked vì chưa chứng minh điều kiện đúng thời điểm tuyệt đối |
| Sheet Execution được sao chép từ file bạn đang làm | 2 Pass / 38 Not Run | Giữ nguyên dữ liệu manual đã lưu; không tự thay thành kết quả automation |

Đây là **kết quả hỗ trợ tự động API/UI**, không phải xác nhận bạn đã trực tiếp thực thi manual đủ 40 case. Test qua API dùng request thật; test giao diện dùng Cypress. Không suy diễn Actual/Pass chỉ từ việc đọc code.

## Cách sử dụng file

- **Ket qua ho tro 40 case:** mỗi dòng có Run ID, build, thời gian, Actual, Status, phương thức xác minh, phạm vi và link evidence.
- **Tong hop ho tro:** tổng hợp, môi trường, fingerprint, file nguồn và hướng dẫn đọc kết quả.
- **Execution / Run setup:** bản sao dữ liệu manual bạn đã lưu; bản gốc không bị ghi đè. Các đường dẫn ảnh cũ trong hai sheet này vẫn tính theo thư mục manual gốc.
- Thư mục `evidence/` cạnh Excel có 40 JSON quan sát và ảnh UI lỗi phụ phí âm. Giữ Excel và thư mục này cùng nhau khi sao chép. Bạn có thể thêm ảnh manual/Postman vào đó rồi ghi thêm đường dẫn ở dòng tương ứng.

## Hai dòng cần chú ý

- **TC-PAY-016 — Fail:** nhập phụ phí âm `-1`, UI vẫn gửi cập nhật và GET xác nhận `Đã thanh toán`, `finalAmount = amountPaid = 99999`. Cột Bug ID ghi cần phân loại lỗi; chưa tự đóng hoặc coi là Pass.
- **TC-APPT-014 — Blocked:** request check-in gần giờ hiện tại trả 200 và có checkInTime. Chênh lệch thực tế được lưu; chưa dùng đồng hồ cố định để kiểm chứng `now == startTime` tuyệt đối.

[JSON tổng hợp](QA-20261114T151532131Z-c5d60f/assisted-results.json) và [run native](../../../automation-testing/reports/runs/QA-20261114T151532131Z-c5d60f/execution.json) giữ nguồn đối chiếu. Run này chạy riêng, không cộng vào kết quả CI 65 test hoặc số manual Pass trong trang tổng hợp QA hiện hành.

## Chạy lại khi cần

Chuẩn bị backend/frontend và môi trường QA như README gốc, rồi chạy từ thư mục gốc:

```sh
node --env-file=.env.test .github/qa/scripts/run-assisted-40.js --source=manual-testing/test-execution/manual-runs/MAN-20261114-01/manual-regression.xlsx
```

Cần Python có `openpyxl` để xuất workbook. Tùy chọn `--screenshots` bật thêm ảnh cho các case UI; mặc định dùng JSON observations và có thể bổ sung ảnh sau. Mỗi lần chạy tạo Run ID và file mới, không ghi đè workbook nguồn. Spec hỗ trợ nằm ở `automation-testing/cypress/assisted/`, ngoài glob E2E thông thường.
