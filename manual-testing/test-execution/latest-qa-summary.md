# Tổng hợp QA mới nhất

Cập nhật: 2026-11-13T15:39:36.601Z. Nguồn máy đọc: [latest-qa-summary.json](latest-qa-summary.json). Đây là trang trạng thái hiện hành; [báo cáo cũ](test-report.md) và các run đã công bố là hồ sơ lịch sử, không sửa lại thành Pass.

## Kết quả mới nhất

| Nhóm | Kết quả | Bằng chứng |
| --- | --- | --- |
| Nghiệp vụ HTTP + UI | **54 Pass / 11 Fail**, 65 test | [JSON](../../automation-testing/reports/runs/QA-20261113T153459634Z-3e9268/execution.json) · [Excel](../../automation-testing/reports/runs/QA-20261113T153459634Z-3e9268/execution.xlsx) |
| API HTTP | 35 Pass / 11 Fail, 46 test | [TAP](../../automation-testing/reports/runs/QA-20261113T153459634Z-3e9268/api/results.tap) · [JUnit](../../automation-testing/reports/runs/QA-20261113T153459634Z-3e9268/api/junit.xml) |
| Hồi quy BUG-002/003 | 7 Pass / 0 Fail | Trong run nghiệp vụ trên |
| Cypress UI/hybrid | 12 Pass / 0 Fail | Trong run nghiệp vụ trên |
| Unit: biên controller + reporting/lifecycle | 19/19 Pass: 6 biên controller + 13 hạ tầng | [Unit JSON](../../automation-testing/reports/runs/QA-20261113T153426945Z-cb851f/unit-results.json) · [TAP](../../automation-testing/reports/runs/QA-20261113T153426945Z-cb851f/unit/results.tap) · [JUnit](../../automation-testing/reports/runs/QA-20261113T153426945Z-cb851f/unit/junit.xml) |
| Newman | 21 request; 46/46 assertions Pass | [JSON](../../api-testing/reports/newman/QA-20261113T153601759Z-bf5a0c/newman-results.json) |
| Manual regression | 0 Pass / 0 Fail / 0 Blocked / **40 Not Run** | [Workbook](../../manual-testing/test-execution/manual-regression.xlsx) · [20 case chạy trước](manual-regression.md) |

## Build và môi trường

- Nghiệp vụ: QA-20261113T153459634Z-3e9268; commit `53f15ae8d2924c9447ca2ebabdc40d6e06e10e76`; fingerprint `9d13f84c13c14d0fa15d7c5562a18c7616a3ac61d51a579abdf4c494857210b9`.
- Bắt đầu/kết thúc UTC: 2026-11-13T15:34:59.634Z / 2026-11-13T15:35:57.842Z; người chạy: automation:local.
- Môi trường: win32, Node v22.15.0, timezone Asia/Saigon, API http://localhost:5000/api, UI http://localhost:5173.
- Unit: QA-20261113T153426945Z-cb851f; Newman: QA-20261113T153601759Z-bf5a0c. Từng báo cáo giữ commit/fingerprint riêng; không suy đoán các run cùng build chỉ vì gần giờ chạy.

## Lỗi hiện hành và kết luận

- [BUG-005](../bug-reports/BUG-005.md): **Open**, High/P0.
- [BUG-006](../bug-reports/BUG-006.md): **Open**, Medium/P2.

BUG-002/003/004 vẫn Closed theo retest đã ghi. Có 2 lỗi chưa Closed trong registry hiện tại. Các test mới mở rộng coverage; run cũ 53 Pass không bao gồm các assertions mới này, nên không có mâu thuẫn khi run mới phát hiện Fail. **Chưa đạt điều kiện phát hành** khi còn lỗi Open và manual chưa thực thi. CI phải Fail khi các assertions nghiệp vụ này Fail; không dùng unit/Newman Pass để che kết quả đó.

## Mức xác minh và việc còn lại

- Biên đúng ±30 phút và lệch 1 ms đã kiểm tra bằng đồng hồ cố định ở **mức controller, persistence mock**. Không tuyên bố là HTTP/UI/manual tại đúng biên.
- Quyền đọc/cập nhật lịch bác sĩ khác và dữ liệu thiếu/ID sai đã có test HTTP thực tế, với lỗi đã ghi trong registry. Chưa xác minh mọi endpoint/nhánh hoặc mọi quy tắc thanh toán.
- Manual do người kiểm thử trực tiếp thực hiện: ưu tiên 20 case trong [hướng dẫn](manual-regression.md), ghi build, dữ liệu, Actual, trạng thái và evidence. Không sao chép kết quả automation vào manual.
- 337 Pass Excel và 288 Pass/26 Fail PDF là [kết quả học phần riêng](history/README.md), không phải retest build mới.

## Cập nhật báo cáo

Chỉ chọn các run hoàn tất đã publish. Từ thư mục gốc:

```sh
node .github/qa/scripts/update-latest-summary.js --run=QA-20261113T153459634Z-3e9268 --unit=QA-20261113T153426945Z-cb851f --postman=QA-20261113T153601759Z-bf5a0c
```

Khi có manual run thật, thêm `--manual=<đường-dẫn-workbook-thực-thi.xlsx>`; script kiểm tra metadata và evidence của dòng đã thực hiện. Không ghi đè run cũ để cập nhật trang này.
