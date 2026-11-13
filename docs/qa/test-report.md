# Test Execution Report — 13/11/2026

## Baseline thiết kế và nguồn số liệu

Excel gốc có **337 ID duy nhất / 20 use case**. PDF tổng hợp 314, nhưng phần chi tiết PDF cộng được 334; nhãn kết quả PDF/Excel cũng khác nhau. [Đối chiếu nguồn](source-reconciliation.md) xác định từng chênh lệch; không giả định đây là hai run độc lập vì thiếu Run ID/build/evidence tương ứng. Chọn Excel làm baseline thiết kế; toàn bộ current manual status vẫn Not Run.

Bộ 70 thiết kế focused là bổ trợ, có hành vi chồng lấp với 337 case gốc, không cộng thành 407 test độc lập. RTM từng run chứa cả hai inventory để truy vết, không dùng số dòng đó làm số scenario Pass.

## Các lần thực thi riêng biệt

| Run | Build | API | UI | Defect regression | Tổng |
| --- | --- | --- | --- | --- | --- |
| [Baseline QA-20261113T072849286Z-115a62](runs/QA-20261113T072849286Z-115a62/summary.md) | 2b94e3a + working-tree hash | 33 Pass | 11 Pass / 1 Fail | 2 Fail | 44 Pass / 3 Fail |
| [Retest QA-20261113T073749688Z-18594c](runs/QA-20261113T073749688Z-18594c/summary.md) | 6fb4482 + working-tree hash | 34 Pass | 12 Pass | 2 Fail | **46 Pass / 2 Fail** |
| [Verification QA-20261113T075024810Z-b5db79](runs/QA-20261113T075024810Z-b5db79/summary.md) | 6fb4482 + working-tree hash | 34 Pass | 12 Pass | 2 Fail | **46 Pass / 2 Fail** |

API bổ sung một ca token hết hạn giữa hai run; không coi hai suite có số lượng hoàn toàn giống nhau. Ca BUG-004 giữ nguyên assertion và dùng fixture mới. Mọi record có Run ID, timestamp UTC, executor, application version/commit/fingerprint, test case ID, expected, actual, status, bug và evidence. Metadata bắt đầu/kết thúc nằm trong từng `run.json`, thời gian Việt Nam là UTC+7.

Môi trường local: Windows, Node.js 22.15.0, MongoDB 8.2.3 local `_test`, Cypress 15.17.0 / Electron 138. CI cấu hình Ubuntu, Node.js 24, MongoDB 7; kết quả CI được ghi riêng sau khi workflow thực sự chạy. Build frontend đạt. **11 test hạ tầng reporting/lifecycle Pass**, không cộng vào 48 test nghiệp vụ.

## Kết quả nghiệp vụ và lifecycle

- BUG-001 tiếp tục Pass: HTTP 401 sai mật khẩu không làm mất lỗi trên form, không tạo session.
- BUG-002 vẫn Fail: lịch hoàn thành bị PATCH lùi trạng thái, HTTP 200 thay vì 400.
- BUG-003 vẫn Fail: hoàn thành lặp tạo hai hóa đơn thay vì một.
- BUG-004 được phát hiện bằng assertion persisted state: UI báo đã thanh toán nhưng amountPaid 0. Commit `6fb4482fca8167ba6a40a956939e25bb9718c987` gửi số tiền thực thu; Retest quan sát amountPaid = finalAmount = 100000, debt = 0. New/Open/Fixed/Retest/Closed được ghi bằng sự kiện thật trong [registry](bugs/registry.json).

[Execution Excel](runs/QA-20261113T075024810Z-b5db79/execution.xlsx), [JSON](runs/QA-20261113T075024810Z-b5db79/execution.json) và [RTM theo kết quả](runs/QA-20261113T075024810Z-b5db79/traceability.csv) cho phép lọc từng case/use case/bug. Các HTTP observations chỉ lưu status và trường nghiệp vụ an toàn; UI có ảnh/video và network assertions. Audit kiểm tra số record khớp native runner và mọi đường dẫn evidence tồn tại.

## Kết luận chất lượng

**Chưa đạt exit criteria phát hành:** hai lỗi High (trong đó BUG-003 P0) còn mở; 337 case gốc chưa có thực thi manual mới; bốn thiết kế thiếu trường cần rà soát. Không có kết quả xác minh đầy đủ cho payroll, doanh thu, SMS/QR, các chức năng kê đơn/tài liệu y khoa, tải hoặc nhiều browser. Các khoảng trống đặc tả/triển khai được ghi trong đối chiếu nguồn, không chuyển thành Pass.

CI chạy đủ API, defect regression và Cypress kể cả khi suite trước Fail, rồi trả nonzero nếu có Fail/Not Run/process error. Artifact vẫn được upload để điều tra. Báo cáo không dùng màu xanh của riêng regression để che hai yêu cầu còn Fail.

[Chỉ mục run và ghi chú exporter](runs/README.md) phân biệt thời gian UI chưa đo được trong hai run đầu với phép đo thật của run verification.
