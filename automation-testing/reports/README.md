# Automation reports

[Chỉ mục các run](runs/README.md) giữ bằng chứng Before Fix → After Fix → Regression. [CI sau sửa](ci-after-fix.json) xác minh 53 test nghiệp vụ Pass và Newman 46 assertions Pass; kết quả lịch sử và run Fail vẫn được giữ nguyên.

`runs/` chứa báo cáo tích hợp có cả API/UI, `evidence/` chứa snapshot ban đầu. `generated/` là runtime/cache local bị Git bỏ qua. [Báo cáo Newman](../../api-testing/reports/README.md) có thư mục riêng ở API testing.

Các manifest/log/CSV/JSON/ảnh trong run đã công bố được di chuyển nguyên byte, không sửa source hash, commit hoặc trạng thái. Đường dẫn trong manifest là đường dẫn tại thời điểm thực thi; tra [legacy-paths.json](legacy-paths.json) khi cần tìm file đã chuyển. Các evidence tương đối bên trong mỗi run giữ nguyên.
