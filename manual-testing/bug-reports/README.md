# Bug register

| ID | Tóm tắt | Severity | Priority | Trạng thái | Bằng chứng |
| --- | --- | --- | --- | --- | --- |
| [BUG-001](BUG-001.md) | Sai mật khẩu làm mất thông báo lỗi trên form | Medium | P1 | Closed, theo CI lịch sử | [Chi tiết](BUG-001.md) |
| [BUG-002](BUG-002.md) | PATCH cho phép lùi trạng thái lịch đã hoàn thành | High | P1 | Closed sau retest | [Trước](../../automation-testing/reports/runs/QA-20261113T124125327Z-5e0311/execution.json) · [Sau](../../automation-testing/reports/runs/QA-20261113T124551346Z-2f0e1e/execution.json) |
| [BUG-003](BUG-003.md) | Hoàn thành lặp tạo trùng hóa đơn | High | P0 | Closed sau retest | [Trước](../../automation-testing/reports/runs/QA-20261113T124125327Z-5e0311/execution.json) · [Sau](../../automation-testing/reports/runs/QA-20261113T124551346Z-2f0e1e/execution.json) |
| [BUG-004](BUG-004.md) | UI thanh toán không lưu số tiền đã thu | High | P1 | Closed sau Fixed/Retest | [Trước](../../automation-testing/reports/runs/QA-20261113T072849286Z-115a62/execution.json) · [Sau](../../automation-testing/reports/runs/QA-20261113T073749688Z-18594c/execution.json) |

Tổng trong registry: **4 bug Closed, 0 Open**. BUG-002/003 được sửa tại `931121c3c28f9a04991cb090669bd50baa50bd3f`; test gốc giữ assertion và Pass, bổ sung ma trận trạng thái, request đồng thời và bảo toàn hóa đơn đã thu tiền. Full regression đạt 53 Pass. Đây là xác nhận phạm vi đã kiểm tra, không bảo đảm ứng dụng không còn lỗi; manual regression 40 case vẫn Not Run. Xem [registry máy đọc](registry.json) và [test report](../test-execution/test-report.md).

Quy tắc lifecycle: New → Open → Fixed → Retest → Closed; Retest thất bại → Reopened → Open/Fixed. `.github/qa/scripts/defect.js` yêu cầu actor, note và evidence. Fixed cần commit tồn tại; Retest cần build có commit sửa; Closed chỉ chấp nhận run Retest có tất cả assertion liên kết Pass. Trạng thái lịch sử BUG-001/002/003 được nhập với nhãn nguồn lịch sử, không bịa thời điểm các bước trung gian.
