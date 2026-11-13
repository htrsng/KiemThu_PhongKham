# Đối chiếu tài liệu gốc

Nguồn gốc được giữ nguyên trong `docs/`: đặc tả, báo cáo cài đặt, báo cáo kiểm thử và Excel. SHA-256, vị trí sheet/dòng và thống kê máy đọc nằm trong [source-reconciliation.json](source-reconciliation.json), [source-cases.csv](../../testing/manual/source-cases.csv).

## Chênh lệch 314 và 337

| Nhóm | PDF bảng 2-1 / 3-1 | Excel đếm ID duy nhất | Chênh lệch |
| --- | ---: | ---: | ---: |
| UC1 | 70 | 68 | −2 |
| UC2 | 92 | 93 | +1 |
| UC3 | 80 | 80 | 0 |
| UC4 | 72 | 96 | +24 |
| Tổng | 314 | 337 | +23 |

PDF [LT2_N02_KiemThu.pdf](../LT2_N02_KiemThu.pdf#page=26), trang PDF 26 (trang in 17), ghi tổng 314. Trang PDF 36 (trang in 27) ghi 288 Pass và 26 Fail. Nhưng các mục UC4.1–UC4.7 tại trang PDF 33–35 ghi 10 + 10 + 12 + 25 + 15 + 10 + 10 = **92**, không phải 72. Cộng chi tiết PDF được 334 case. Excel có UC4.4 là 29 thay vì 25, UC2.1 là 13 thay vì 12, và UC1.1 chỉ có 18 ID thay vì 20. Không tự tạo hai ID còn thiếu để khớp số lượng.

Excel có đúng 337 ID duy nhất, không trùng; 335 nhãn `Passed` và 2 nhãn `Pass`, được chuẩn hóa thành **337 Pass của đợt kiểm thử gốc** theo file đã test do chủ dự án cung cấp. Cả 20 sheet có ghi chú kiểm thử cuối 14/06/2026; một số case có `Build v1.0` trong remarks. Các trường Run ID gốc, build commit và người thực hiện theo từng case còn thiếu được giữ rõ, không tự điền.

[Báo cáo lịch sử](history/manual-execution.xlsx) giữ actual/status và evidence nguồn. Không có căn cứ để tự kết luận PDF là trước retest còn Excel là sau retest; giữ riêng hai hồ sơ. Kết quả lịch sử được sử dụng, nhưng không được coi là kết quả đã chạy lại trên build hiện tại.

## Chuẩn hóa và phạm vi

`source-cases.csv` giữ ID/Req Ref, actual/status/remarks, ngày/build được ghi và sheet/dòng gốc. `Historical status` giữ kết quả đã test; `Current status = Not Run` chỉ dành cho lần manual hồi quy mới chưa thực hiện, không xóa bỏ kết quả lịch sử. 15 rủi ro quyền truy cập, lịch trùng/sức chứa, check-in và sai tiền được ưu tiên P0; còn lại High→P1, Medium→P2, Low→P3. Đây là phân loại kế hoạch mới, không sửa mức ưu tiên trong Excel gốc.

Bốn thiết kế có trường thiếu được đánh dấu cần rà soát: `TC-UC34-005` (steps/kỳ vọng), `TC-UC33-014` (input), `TC-UC31-004` (step expected), `TC-UC13-001` (overall expected). Năm case thiếu actual lịch sử không được điền bằng expected. Mọi actual mới phải lấy từ lần thực thi thật.

Bộ 70 case trong `test-cases.csv` là thiết kế hồi quy tập trung, có nội dung chồng lấp với 337 case gốc; **không cộng thành 407 kịch bản độc lập**. `trace-links.json` chỉ liên kết các hành vi liên quan đã xem xét. RTM từng run liệt kê đủ 337 case gốc và 70 case bổ trợ, tách `Manual status`, `Automation status` và mức bao phủ Partial.

## Khác biệt đặc tả cần lưu ý

- Đặc tả UC3.1 trang PDF 42 yêu cầu check-in trong ngày và đúng một lần; quy tắc ±30 phút trong regression đến từ thiết kế/code hiện tại, không thay thế đặc tả gốc.
- UC3.3 trang PDF 46 yêu cầu một hóa đơn chính thức cho mỗi lịch, lưu số tiền thực thu và hạn chế sửa/xóa hóa đơn đã xuất. Test Admin xóa hóa đơn tạm không chứng minh chính sách hóa đơn chính thức đã được triển khai.
- Workbook có split payment, QR check-in, SMS, kê đơn/ICD-10, vai trò Kế toán/Bệnh nhân; chưa được xác minh như các tính năng hoàn chỉnh trong bản ứng dụng này. Không đánh dấu Covered/Pass chỉ vì có test design.

Những khác biệt trên là khoảng trống cần đối chiếu cho phiên bản hiện tại, không phủ nhận kết quả trong hồ sơ cũ. RTM lịch sử nối đủ 20 use case với trang đặc tả, mã liên quan và 337 kết quả nguồn; các run có build/Run ID riêng phản ánh hồi quy mới.
