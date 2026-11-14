# Tổng hợp QA mới nhất

Cập nhật: 2026-11-14T16:51:44.350Z. Nguồn máy đọc: [latest-qa-summary.json](latest-qa-summary.json). Đây là trang trạng thái hiện hành; [báo cáo cũ](test-report.md) và các run đã công bố là hồ sơ lịch sử, không sửa lại thành Pass.

## Kết quả mới nhất

| Nhóm | Kết quả | Bằng chứng |
| --- | --- | --- |
| Nghiệp vụ HTTP + UI | **65 Pass / 0 Fail**, 65 test | [JSON](../../automation-testing/reports/runs/QA-20261114T164815189Z-178426/execution.json) · [Excel](../../automation-testing/reports/runs/QA-20261114T164815189Z-178426/execution.xlsx) |
| API HTTP | 46 Pass / 0 Fail, 46 test | [TAP](../../automation-testing/reports/runs/QA-20261114T164815189Z-178426/api/results.tap) · [JUnit](../../automation-testing/reports/runs/QA-20261114T164815189Z-178426/api/junit.xml) |
| Hồi quy BUG-002/003 | 7 Pass / 0 Fail | Trong run nghiệp vụ trên |
| Cypress UI/hybrid | 12 Pass / 0 Fail | Trong run nghiệp vụ trên |
| Unit: biên controller + reporting/lifecycle | 19/19 Pass: 6 biên controller + 13 hạ tầng | [Unit JSON](../../automation-testing/reports/runs/QA-20261114T164835731Z-7ba849/unit-results.json) · [TAP](../../automation-testing/reports/runs/QA-20261114T164835731Z-7ba849/unit/results.tap) · [JUnit](../../automation-testing/reports/runs/QA-20261114T164835731Z-7ba849/unit/junit.xml) |
| Newman | 21 request; 46/46 assertions Pass | [JSON](../../api-testing/reports/newman/QA-20261114T164829754Z-c4f8d8/newman-results.json) |
| Bộ 40 case — kết quả đã ghi | 38 Pass / 1 Fail / 1 Blocked / **0 Not Run** | [Workbook](../../manual-testing/test-execution/manual-runs/MAN-20261114-01/manual-regression.xlsx) · [Hướng dẫn và phần cần retest](manual-regression.md) |

## Build và môi trường

- Nghiệp vụ: QA-20261114T164815189Z-178426; commit `1bb247a27a205186791cacabacd6d7fd42e34b24`; fingerprint `b9c610cdd669f5a25e84354eed7dcbbe1a0c09a697d3714f0743c1a1484c926f`.
- Bắt đầu/kết thúc UTC: 2026-11-14T16:48:15.189Z / 2026-11-14T16:49:06.989Z; người chạy: automation:local.
- Môi trường: win32, Node v22.15.0, timezone Asia/Saigon, API http://localhost:5000/api, UI http://localhost:5173.
- Unit: QA-20261114T164835731Z-7ba849; Newman: QA-20261114T164829754Z-c4f8d8. Từng báo cáo giữ commit/fingerprint riêng; không suy đoán các run cùng build chỉ vì gần giờ chạy.

## Lỗi hiện hành và kết luận



Cả 6 bug trong registry đã Closed theo bằng chứng retest tương ứng. BUG-005/006 được sửa tại commit 1bb247a; báo cáo trước sửa 54 Pass / 11 Fail được giữ nguyên. Bộ chuẩn hiện đạt 65 Pass / 0 Fail. **Chưa kết luận đạt điều kiện phát hành**: workbook 40 case vẫn có TC-PAY-016 Fail, TC-APPT-014 Blocked và ảnh đang bổ sung; retest BUG-005/006 không giải quyết các mục này. CI vẫn phải Fail nếu có assertion nghiệp vụ Fail; retest local Pass không thay thế việc kiểm tra lần chạy GitHub mới nhất.

## Mức xác minh và việc còn lại

- Biên đúng ±30 phút và lệch 1 ms đã kiểm tra bằng đồng hồ cố định ở **mức controller, persistence mock**. Không tuyên bố là HTTP/UI/manual tại đúng biên.
- Quyền đọc/cập nhật lịch bác sĩ khác và dữ liệu thiếu/ID sai đã có test HTTP thực tế; BUG-005/006 đã retest Pass và Closed. Chưa xác minh mọi endpoint/nhánh hoặc mọi quy tắc thanh toán.
- Workbook 40 case đã có Actual/trạng thái: 38 Pass, 1 Fail, 1 Blocked. Ảnh manual đang bổ sung; số liệu được báo cáo theo workbook, chưa chứng nhận độc lập toàn bộ thao tác manual. Nguồn API/UI hỗ trợ và ảnh manual phải được phân biệt.
- 337 Pass Excel và 288 Pass/26 Fail PDF là [kết quả học phần riêng](history/README.md), không phải retest build mới.

## Cập nhật báo cáo

Chỉ chọn các run hoàn tất đã publish. Từ thư mục gốc:

```sh
node .github/qa/scripts/update-latest-summary.js --run=QA-20261114T164815189Z-178426 --unit=QA-20261114T164835731Z-7ba849 --postman=QA-20261114T164829754Z-c4f8d8 --manual=manual-testing/test-execution/manual-runs/MAN-20261114-01/manual-regression.xlsx --manual-recorded=true
```

Chế độ `--manual-recorded=true` ghi nhận số liệu workbook khi ảnh còn đang bổ sung và liệt kê evidence chưa có trong JSON; không đồng nghĩa đã xác minh đầy đủ manual. Bỏ tùy chọn này khi muốn kiểm tra nghiêm ngặt sự tồn tại của evidence. Không ghi đè run cũ để cập nhật trang này.

## Hồ sơ 40 case đã cập nhật

- [Workbook đã điền](../../manual-testing/test-execution/manual-runs/MAN-20261114-01/manual-regression.xlsx): 38 Pass / 1 Fail / 1 Blocked; mẫu trống không còn được dùng làm kết quả hiện tại.
- [Nguồn API/UI hỗ trợ](assisted-runs/README.md) giữ kết quả và observations riêng. Không cộng bộ hỗ trợ này vào 65 test nghiệp vụ CI.
- TC-PAY-016 Fail vì phụ phí âm vẫn được thanh toán; TC-APPT-014 Blocked vì chưa kiểm soát thời điểm tuyệt đối. Đây không phải xác nhận hai trường hợp đã được sửa.
- Ảnh manual còn đang bổ sung; JSON hiện ghi 2 đường dẫn evidence trong workbook chưa tìm thấy. Các link JSON API/UI có sẵn không thay thế nhãn ảnh manual.
