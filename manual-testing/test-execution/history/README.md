# Kết quả kiểm thử gốc

Đây là dữ liệu từ các file đã kiểm thử do chủ dự án cung cấp, được chuẩn hóa để dùng trong hồ sơ QA. Giữ nguyên nhãn kết quả và actual có trong nguồn; không chuyển các case đã test trước đây sang Not Run chỉ vì chưa chạy lại build hiện tại.

| Hồ sơ | Kết quả được ghi | Căn cứ |
| --- | --- | --- |
| HIST-EXCEL-20260614 | 337 ID duy nhất, 337 Pass | [Excel gốc](../../../docs/academic/LT2_N02_TestCase%20%282%29.xlsx), 20 sheet có ghi chú ngày kiểm thử cuối 14/06/2026 |
| HIST-PDF-202606 | 314 case, 288 Pass, 26 Fail | [PDF kiểm thử trang 36](../../../docs/academic/LT2_N02_KiemThu.pdf#page=36), báo cáo tháng 6/2026 |

Các mã HIST là mã hồ sơ nhập bổ sung để quản lý, không phải Run ID có sẵn trong nguồn. Ngày 14/06 là ghi chú cấp sheet, không phải timestamp riêng từng case. Build chỉ điền khi remarks của chính case có ghi; người thực hiện theo từng case không được ghi trong Excel, còn phân công QA dự án nằm ở trang 2 PDF. Không tự điền metadata còn thiếu.

## Các file sử dụng

- [manual-execution.xlsx](manual-execution.xlsx): kết quả Excel gốc đã chuẩn hóa, actual/status, tổng hợp theo use case và sheet RTM.
- [manual-execution.csv](manual-execution.csv): cùng 337 bản ghi để lọc, đối chiếu và import công cụ quản lý test.
- [rtm.csv](../../rtm/historical-rtm.csv): 337 case nối với trang đặc tả, mã tham chiếu, kết quả lịch sử và kết quả automation liên quan.

Các file chuẩn hóa được sinh từ nguồn bằng `node .github/qa/scripts/normalize-sources.js`. Ghi nhận thực thi của đợt mới trong workbook/run mới, không sửa đè kết quả của đợt cũ.

Cột Evidence trỏ tới chính dòng kết quả trong tài liệu gốc, không giả là screenshot hoặc log mới. Năm dòng thiếu actual được ghi rõ, không lấy expected điền thay. Các tham chiếu `Bug #...` trong remarks được giữ nguyên, không tự gán sang các BUG-001…004 của hồi quy hiện tại.

## Vai trò từng tài liệu gốc

| Tài liệu | Dùng để |
| --- | --- |
| [Đặc tả](../../../docs/requirements/LT2_N02_DacTa.pdf) | Xác định phạm vi 20 use case và quy tắc nghiệp vụ; trang đầu mỗi UC được chỉ rõ trong RTM |
| [Cài đặt](../../../docs/academic/LT2_N02_CaiDat-1.pdf#page=17) | Đối chiếu kiến trúc ba tầng React/TypeScript → Express → MongoDB và môi trường ứng dụng |
| [Kiểm thử](../../../docs/academic/LT2_N02_KiemThu.pdf) | Kế hoạch, phân công, kỹ thuật, số liệu và kết luận của đợt kiểm thử gốc |
| Excel gốc | ID, steps, expected, actual, status, remarks và ngày ghi chú của từng sheet |

PDF cài đặt dùng sơ đồ/ví dụ tên entry point khác bản repo; lệnh chạy hiện tại theo `server/package.json` và `server/server.js`. Cột implementation trong RTM chỉ là mã liên quan để đối chiếu, không khẳng định mọi tính năng đã khớp toàn bộ đặc tả.

Số liệu PDF và Excel không trùng nhau; [đối chiếu nguồn](../../../docs/requirements/source-reconciliation.md) giữ nguyên cả hai, không tự suy ra chúng là trước/sau retest. [Các run hồi quy mới](../../../automation-testing/reports/runs/README.md) là lớp kết quả riêng cho build hiện tại. Không cộng số Pass giữa các hồ sơ.
