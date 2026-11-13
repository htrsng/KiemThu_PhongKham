# Các lần thực thi

| Run | Mục đích | Kết quả |
| --- | --- | --- |
| [QA-20261113T072849286Z-115a62](QA-20261113T072849286Z-115a62/summary.md) | Baseline, phát hiện BUG-004 | 44 Pass / 3 Fail |
| [QA-20261113T073749688Z-18594c](QA-20261113T073749688Z-18594c/summary.md) | Retest commit sửa BUG-004, bổ sung expired-token test | 46 Pass / 2 Fail |
| [QA-20261113T075024810Z-b5db79](QA-20261113T075024810Z-b5db79/summary.md) | Xác minh exporter thời gian/lỗi Cypress và fixture đúng ngày | 46 Pass / 2 Fail |
| [QA-20261113T124125327Z-5e0311](QA-20261113T124125327Z-5e0311/summary.md) | Before Fix: chạy lại đúng hai test BUG-002/003 | 2 Fail; không chạy API/UI |
| [QA-20261113T124551346Z-2f0e1e](QA-20261113T124551346Z-2f0e1e/summary.md) | After Fix + full regression, thêm 5 defect tests | 34 API + 12 UI + 7 defect tests Pass |
| [QA-20261113T124931337Z-ba424a](../../../api-testing/reports/newman/QA-20261113T124931337Z-ba424a/summary.md) | Collection Postman thực thi bằng Newman; dữ liệu QA riêng | 21 requests, 46/46 assertions Pass |

Mỗi run có build, source fingerprint, executor và thời gian riêng. Không cộng dồn số Pass giữa các run. Hai run đầu có `durationMs = 0` cho UI do exporter chưa đọc được trường thời gian; đây là **không thu được phép đo**, không phải test chạy 0 ms. Bản cuối lấy duration và assertion error từ Mochawesome gốc, có unit test chống lệch trạng thái giữa các reporter. Không chỉnh sửa dữ liệu lịch sử đã công bố để che lỗi exporter.

Manual retest mới vẫn Not Run; kết quả lịch sử đã test giữ trong `history/`. 407 dòng RTM gồm 337 case gốc và 70 thiết kế hồi quy chồng lấp, không phải 407 scenario độc lập hoặc đã thực thi thủ công trên build mới. Artifact CI có Run ID riêng và được giữ trên GitHub Actions. Run Newman dùng `newman-results.json`, tách khỏi số lượng Node/Cypress.
