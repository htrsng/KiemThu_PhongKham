# Kiểm thử thủ công

[Tổng quan dự án](../README.md) | [Kiểm thử API](../api-testing/README.md) | [Kiểm thử tự động](../automation-testing/README.md)

## 1. Tổng quan

Kiểm thử thủ công chuyển yêu cầu nghiệp vụ SmileCare thành kịch bản, test case, hồ sơ thực thi và báo cáo lỗi có thể tái hiện. Hồ sơ học phần bao phủ 20 use case về danh mục, lịch khám, tiếp đón/điều trị, thanh toán, doanh thu và tiền lương. Kế hoạch hồi quy hiện tại ưu tiên xác thực, phân quyền, lịch hẹn/check-in và hóa đơn/thanh toán.

Bắt đầu từ [kế hoạch kiểm thử](test-plan/test-plan.md) và [danh mục kịch bản](test-scenarios/scenarios.md). Phạm vi đã thiết kế, kết quả thực thi học phần và retest trên build mới được ghi riêng.

## 2. Kỹ thuật thiết kế kiểm thử

| Kỹ thuật | Áp dụng | Ví dụ trong thiết kế |
| --- | --- | --- |
| Phân vùng tương đương (EP) | Email hợp lệ/không hợp lệ; thiếu tiền khi có/không cho ghi nợ | TC-AUTH-003, TC-PAY-007/008 |
| Phân tích giá trị biên (BVA) | Giới hạn giờ check-in, độ dài mật khẩu tối thiểu, giảm giá 100%, phụ phí âm | TC-AUTH-006, TC-APPT-011 đến 014, TC-PAY-012/016 |
| Bảng quyết định | Giảm giá theo số tiền/phần trăm kết hợp phụ phí | TC-PAY-013/014 |
| Chuyển trạng thái | Chuyển trạng thái lịch hẹn hợp lệ; lùi trạng thái/hủy sai | TC-APPT-016 đến 021 |
| Đoán lỗi | Hoàn thành lịch lặp và tác động tạo trùng hóa đơn | TC-APPT-022 / BUG-003 |

Đây là **ví dụ thiết kế**, không phải bằng chứng mọi ví dụ đã chạy trên build hiện tại. Đúng ±30 phút và lệch 1 ms đã có sáu unit test controller dùng đồng hồ cố định/persistence mock. HTTP kiểm tra sớm 29 phút, trễ 31 phút và đúng giờ hiện tại; chưa có bằng chứng HTTP/UI/manual tại đúng biên.

## 3. Danh mục test case

| Bộ case | Mục đích | Cách hiểu kết quả thực thi |
| --- | --- | --- |
| [337 case gốc](test-cases/source-cases.csv) / 20 use case | Chuẩn hóa workbook học phần, giữ sheet/dòng nguồn và kết quả gốc | Excel ghi 337 Pass; là thực thi lịch sử, không phải retest build mới |
| [70 case tập trung](test-cases/test-cases.csv) | Thiết kế hồi quy bổ trợ có bước, dữ liệu, kỳ vọng, ưu tiên và kỹ thuật | Một số assertions đã được tự động hóa; chưa retest thủ công toàn bộ bộ case |
| [Bộ ưu tiên 40 case](test-cases/regression-suite.csv) | Tập con về xác thực/phân quyền, lịch hẹn/check-in, thanh toán và BUG-002/003/004 | Workbook đã ghi **38 Pass / 1 Fail / 1 Blocked**; ảnh manual đang bổ sung, kết quả hỗ trợ API/UI có nguồn riêng |

70 case tập trung có chồng lấp với 337 case gốc: **không cộng thành 407 kịch bản độc lập**. Bộ 40 case là tập con, không phải bộ bổ sung. Automation bao phủ một phần không có nghĩa toàn bộ case đã Pass manual.

Bốn trường thiết kế thiếu được bổ sung bằng [bản hiệu chỉnh](test-cases/source-corrections.json), giữ nguyên file gốc, trạng thái lịch sử và các trường Actual lịch sử còn thiếu. [Đối chiếu nguồn](../docs/requirements/source-reconciliation.md) giải thích riêng bảng PDF: 314 case, 288 Pass / 26 Fail. Chưa xác định được thứ tự thời gian của hai bộ kết quả Excel và PDF.

## 4. Thực thi kiểm thử

Kết quả hiện tại ở [workbook đã điền MAN-20261114-01](test-execution/manual-runs/MAN-20261114-01/manual-regression.xlsx), sheet **Execution**. Các dòng đã có build, thời gian, Actual và trạng thái; ảnh manual đang bổ sung. [Workbook 40 case trống](test-execution/manual-regression.xlsx) là mẫu dùng cho đợt mới. [Workbook tổng](test-execution/test-execution.xlsx) được giữ riêng.

Kết quả ghi trong file: **38 Pass / 1 Fail / 1 Blocked**. TC-PAY-016 Fail do phụ phí `-1` vẫn được thanh toán với thành tiền/thực thu `99999`; TC-APPT-014 Blocked vì chưa xác minh thời điểm bằng nhau tuyệt đối. Xem [nguồn API/UI hỗ trợ](test-execution/assisted-runs/README.md) và [hướng dẫn bổ sung evidence/retest](test-execution/manual-regression.md). Hoàn tất nhập kết quả không đồng nghĩa mọi case đều Pass hoặc ảnh đã đầy đủ.

1. Lưu bản sao mới cho mỗi Run ID. Ghi commit build, môi trường/trình duyệt, người thực hiện và thời gian thực tế.
2. Chuẩn bị dữ liệu giả và ghi ID bệnh nhân/lịch hẹn/hóa đơn đã dùng. Thực hiện các bước trên đúng build đó.
3. So sánh quan sát với **Expected — kết quả mong đợi**. Ghi thông báo, HTTP status, trạng thái đã lưu, số hóa đơn hoặc số dư thực tế vào **Actual — kết quả thực tế**, kèm ảnh hoặc response đã làm sạch.
4. Chọn **Pass** khi đã quan sát đủ kỳ vọng; **Fail** nếu sai khác; **Blocked** kèm điều kiện/tính năng đang thiếu; case chưa làm giữ **Not Run**. Ghi Bug ID khi có lỗi.

Kết quả học phần có ở [Excel](test-execution/history/manual-execution.xlsx) và [CSV](test-execution/history/manual-execution.csv). Metadata thiếu trong nguồn tiếp tục được ghi rõ là chưa có. Không chép kết quả automation vào trường manual hoặc lấy Expected điền cho Actual lịch sử còn thiếu.

[Tổng hợp QA mới nhất](test-execution/latest-qa-summary.md) là nguồn trạng thái hiện hành; [báo cáo lịch sử](test-execution/test-report.md) giữ các run trước mở rộng coverage. Bộ 40 đã ghi kết quả, còn bổ sung ảnh và xử lý Fail/Blocked; không còn mô tả cả bộ là 40 Not Run. Dự án không khẳng định đã chạy lại thủ công toàn bộ 337 case.

## 5. Quản lý lỗi

[Sổ theo dõi lỗi](bug-reports/README.md) dẫn đến tiền điều kiện, bước tái hiện, kết quả mong đợi/thực tế, severity, priority và bằng chứng. [Registry JSON](bug-reports/registry.json) lưu sự kiện vòng đời.

| Lỗi | Hiện tượng | Kết quả xác minh |
| --- | --- | --- |
| [BUG-002](bug-reports/BUG-002.md) | Lịch đã hoàn thành bị lùi trạng thái | Closed sau retest tự động: HTTP 400, trạng thái đã lưu giữ nguyên |
| [BUG-003](bug-reports/BUG-003.md) | Hoàn thành lặp tạo trùng hóa đơn | Closed sau retest tuần tự/đồng thời: đúng một hóa đơn |
| [BUG-004](bug-reports/BUG-004.md) | UI thu tiền mặt không lưu số tiền thực thu | Closed sau retest: amountPaid = finalAmount, debt = 0 |
| [BUG-005](bug-reports/BUG-005.md) | Doctor đọc/cập nhật lịch bác sĩ khác | Closed, High/P0; ba test HTTP Pass sau sửa |
| [BUG-006](bug-reports/BUG-006.md) | Dữ liệu thiếu/ID sai trả HTTP 500 | Closed, Medium/P2; chín test HTTP Pass sau sửa |

Vòng đời: **New → Open → Fixed → Retest → Closed**; retest thất bại chuyển Reopened. Giữ bằng chứng Trước sửa → Sau sửa → Hồi quy. [Trước sửa](../automation-testing/reports/runs/QA-20261113T124125327Z-5e0311/execution.json) và [Sau sửa / Hồi quy](../automation-testing/reports/runs/QA-20261113T124551346Z-2f0e1e/execution.json) là hai hồ sơ riêng, không ghi đè. Đóng lỗi cần commit sửa và assertions retest liên kết đều Pass; kết quả trong workbook và nguồn automation được ghi đúng phạm vi.

## 6. Truy xuất yêu cầu

- [RTM lịch sử](rtm/historical-rtm.csv): 337 case gốc thuộc 20 use case, trang đặc tả, mã nguồn liên quan và kết quả lịch sử.
- [RTM tập trung](rtm/rtm.tsv): 31 yêu cầu; 30 Current và một yêu cầu tiền lương Deferred. Coverage là Designed — đã thiết kế, không phải đã thực thi.
- [Liên kết case tập trung với nguồn](rtm/trace-links.json): ánh xạ hành vi liên quan, không chứng minh hai kịch bản tương đương toàn bộ.
- [RTM theo run](../automation-testing/reports/runs/QA-20261113T124551346Z-2f0e1e/traceability.csv): trạng thái manual và automation một phần nằm ở các trường riêng.

Chạy `node .github/qa/scripts/audit-qa.js` từ thư mục gốc sau khi sửa thiết kế/ánh xạ. Làm theo [CONTRIBUTING.md](../CONTRIBUTING.md) để giữ tính toàn vẹn của nguồn và bằng chứng.
