# Các lần thực thi

| Run | Mục đích | Kết quả |
| --- | --- | --- |
| [QA-20261113T072849286Z-115a62](QA-20261113T072849286Z-115a62/summary.md) | Baseline, phát hiện BUG-004 | 44 Pass / 3 Fail |
| [QA-20261113T073749688Z-18594c](QA-20261113T073749688Z-18594c/summary.md) | Retest commit sửa BUG-004, bổ sung expired-token test | 46 Pass / 2 Fail |
| [QA-20261113T075024810Z-b5db79](QA-20261113T075024810Z-b5db79/summary.md) | Xác minh exporter thời gian/lỗi Cypress và fixture đúng ngày | 46 Pass / 2 Fail |

Mỗi run có build, source fingerprint, executor và thời gian riêng. Không cộng dồn số Pass giữa các run. Hai run đầu có `durationMs = 0` cho UI do exporter chưa đọc được trường thời gian; đây là **không thu được phép đo**, không phải test chạy 0 ms. Bản cuối lấy duration và assertion error từ Mochawesome gốc, có unit test chống lệch trạng thái giữa các reporter. Không chỉnh sửa dữ liệu lịch sử đã công bố để che lỗi exporter.

Manual vẫn Not Run. 407 dòng RTM gồm 337 case gốc và 70 thiết kế hồi quy chồng lấp, không phải 407 scenario độc lập hoặc đã thực thi thủ công. Artifact CI có Run ID riêng và được giữ trên GitHub Actions.
