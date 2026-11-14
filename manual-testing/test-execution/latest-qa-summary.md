# Tổng hợp QA mới nhất

Cập nhật: 2026-11-14T16:36:14.449Z. Nguồn máy đọc: [latest-qa-summary.json](latest-qa-summary.json). Đây là trang trạng thái hiện hành; [báo cáo cũ](test-report.md) và các run đã công bố là hồ sơ lịch sử, không sửa lại thành Pass.

## Kết quả mới nhất

| Nhóm | Kết quả | Bằng chứng |
| --- | --- | --- |
| Nghiệp vụ HTTP + UI | **54 Pass / 11 Fail**, 65 test | [JSON](../../automation-testing/reports/runs/QA-20261113T153459634Z-3e9268/execution.json) · [Excel](../../automation-testing/reports/runs/QA-20261113T153459634Z-3e9268/execution.xlsx) |
| API HTTP | 35 Pass / 11 Fail, 46 test | [TAP](../../automation-testing/reports/runs/QA-20261113T153459634Z-3e9268/api/results.tap) · [JUnit](../../automation-testing/reports/runs/QA-20261113T153459634Z-3e9268/api/junit.xml) |
| Hồi quy BUG-002/003 | 7 Pass / 0 Fail | Trong run nghiệp vụ trên |
| Cypress UI/hybrid | 12 Pass / 0 Fail | Trong run nghiệp vụ trên |
| Unit: biên controller + reporting/lifecycle | 19/19 Pass: 6 biên controller + 13 hạ tầng | [Unit JSON](../../automation-testing/reports/runs/QA-20261113T153426945Z-cb851f/unit-results.json) · [TAP](../../automation-testing/reports/runs/QA-20261113T153426945Z-cb851f/unit/results.tap) · [JUnit](../../automation-testing/reports/runs/QA-20261113T153426945Z-cb851f/unit/junit.xml) |
| Newman | 21 request; 46/46 assertions Pass | [JSON](../../api-testing/reports/newman/QA-20261113T153601759Z-bf5a0c/newman-results.json) |
| Bộ 40 case — kết quả đã ghi | 38 Pass / 1 Fail / 1 Blocked / **0 Not Run** | [Workbook](../../manual-testing/test-execution/manual-runs/MAN-20261114-01/manual-regression.xlsx) · [Hướng dẫn và phần cần retest](manual-regression.md) |

## Build và môi trường

- Nghiệp vụ: QA-20261113T153459634Z-3e9268; commit `53f15ae8d2924c9447ca2ebabdc40d6e06e10e76`; fingerprint `9d13f84c13c14d0fa15d7c5562a18c7616a3ac61d51a579abdf4c494857210b9`.
- Bắt đầu/kết thúc UTC: 2026-11-13T15:34:59.634Z / 2026-11-13T15:35:57.842Z; người chạy: automation:local.
- Môi trường: win32, Node v22.15.0, timezone Asia/Saigon, API http://localhost:5000/api, UI http://localhost:5173.
- Unit: QA-20261113T153426945Z-cb851f; Newman: QA-20261113T153601759Z-bf5a0c. Từng báo cáo giữ commit/fingerprint riêng; không suy đoán các run cùng build chỉ vì gần giờ chạy.

## Lỗi hiện hành và kết luận

- [BUG-005](../bug-reports/BUG-005.md): **Open**, High/P0.
- [BUG-006](../bug-reports/BUG-006.md): **Open**, Medium/P2.

BUG-002/003/004 vẫn Closed theo retest đã ghi. Có 2 lỗi chưa Closed trong registry hiện tại. Các test mới mở rộng coverage; run cũ 53 Pass không bao gồm các assertions mới này, nên không có mâu thuẫn khi run mới phát hiện Fail. **Chưa đạt điều kiện phát hành** khi còn lỗi Open, một case Blocked và ảnh thực thi đang bổ sung. CI phải Fail khi các assertions nghiệp vụ này Fail; không dùng unit/Newman Pass để che kết quả đó.

## Mức xác minh và việc còn lại

- Biên đúng ±30 phút và lệch 1 ms đã kiểm tra bằng đồng hồ cố định ở **mức controller, persistence mock**. Không tuyên bố là HTTP/UI/manual tại đúng biên.
- Quyền đọc/cập nhật lịch bác sĩ khác và dữ liệu thiếu/ID sai đã có test HTTP thực tế, với lỗi đã ghi trong registry. Chưa xác minh mọi endpoint/nhánh hoặc mọi quy tắc thanh toán.
- Workbook 40 case đã có Actual/trạng thái: 38 Pass, 1 Fail, 1 Blocked. Ảnh manual đang bổ sung; số liệu được báo cáo theo workbook, chưa chứng nhận độc lập toàn bộ thao tác manual. Nguồn API/UI hỗ trợ và ảnh manual phải được phân biệt.
- 337 Pass Excel và 288 Pass/26 Fail PDF là [kết quả học phần riêng](history/README.md), không phải retest build mới.

## Cập nhật báo cáo

Chỉ chọn các run hoàn tất đã publish. Từ thư mục gốc:

```sh
node .github/qa/scripts/update-latest-summary.js --run=QA-20261113T153459634Z-3e9268 --unit=QA-20261113T153426945Z-cb851f --postman=QA-20261113T153601759Z-bf5a0c --manual=manual-testing/test-execution/manual-runs/MAN-20261114-01/manual-regression.xlsx --manual-recorded=true
```

Chế độ `--manual-recorded=true` ghi nhận số liệu workbook khi ảnh còn đang bổ sung và liệt kê evidence chưa có trong JSON; không đồng nghĩa đã xác minh đầy đủ manual. Bỏ tùy chọn này khi muốn kiểm tra nghiêm ngặt sự tồn tại của evidence. Không ghi đè run cũ để cập nhật trang này.

## Hồ sơ 40 case đã cập nhật

- [Workbook đã điền](../../manual-testing/test-execution/manual-runs/MAN-20261114-01/manual-regression.xlsx): 38 Pass / 1 Fail / 1 Blocked; mẫu trống không còn được dùng làm kết quả hiện tại.
- [Nguồn API/UI hỗ trợ](assisted-runs/README.md) giữ kết quả và observations riêng. Không cộng bộ hỗ trợ này vào 65 test nghiệp vụ CI.
- TC-PAY-016 Fail vì phụ phí âm vẫn được thanh toán; TC-APPT-014 Blocked vì chưa kiểm soát thời điểm tuyệt đối. Đây không phải xác nhận hai trường hợp đã được sửa.
- Ảnh manual còn đang bổ sung; JSON hiện ghi 2 đường dẫn evidence trong workbook chưa tìm thấy. Các link JSON API/UI có sẵn không thay thế nhãn ảnh manual.

## Xác minh CI hiện hành

[Workflow 43455436873](https://github.com/htrsng/KiemThu_PhongKham/actions/runs/43455436873), head `420cc74dc2ffa318bab9a08ffa143121d4a59c4f`: **failure**. Bước Fail là Full QA run do 11 assertions của BUG-005/006; unit 19 Pass, UI 12 Pass và Newman 46 assertions Pass. Đã tải artifact 14054215848, kiểm tra 116 file và mọi evidence link, có ảnh/video/HTML. [Metadata xác minh](../../automation-testing/reports/ci-coverage-verification.json).

Run CI `QA-20261113T154518142Z-1685ef` độc lập với run local phía trên; cả hai có cùng số Pass/Fail, không gán chung commit/fingerprint. Để giữ phần xác minh khi sinh lại, thêm `--ci=automation-testing/reports/ci-coverage-verification.json` vào lệnh cập nhật.
