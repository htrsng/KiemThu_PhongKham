# Bug register

| ID | Tóm tắt | Severity | Priority | Trạng thái | Bằng chứng |
| --- | --- | --- | --- | --- | --- |
| [BUG-001](bugs/BUG-001.md) | Sai mật khẩu làm mất thông báo lỗi trên form | Medium | P1 | Closed, theo CI lịch sử | [Chi tiết](bugs/BUG-001.md) |
| [BUG-002](bugs/BUG-002.md) | PATCH cho phép lùi trạng thái lịch đã hoàn thành | High | P1 | Open | [TAP](evidence/2026-11-13/known-defects-results.tap) |
| [BUG-003](bugs/BUG-003.md) | Hoàn thành lặp tạo trùng hóa đơn | High | P0 | Open | [TAP](evidence/2026-11-13/known-defects-results.tap) |
| [BUG-004](bugs/BUG-004.md) | UI thanh toán không lưu số tiền đã thu | High | P1 | Closed sau Fixed/Retest | [Trước](runs/QA-20261113T072849286Z-115a62/execution.json) · [Sau](runs/QA-20261113T073749688Z-18594c/execution.json) |

Tổng: **4 bug, 2 Closed, 2 Open**. BUG-002/003 chưa có bản sửa, test vẫn giữ assertion và trả Fail. BUG-004 có đầy đủ New → Open → Fixed → Retest → Closed; xem [registry máy đọc](bugs/registry.json) và [test report](test-report.md).

Quy tắc lifecycle: New → Open → Fixed → Retest → Closed; Retest thất bại → Reopened → Open/Fixed. `testing/scripts/defect.js` yêu cầu actor, note và evidence. Fixed cần commit tồn tại; Retest cần build có commit sửa; Closed chỉ chấp nhận run Retest có tất cả assertion liên kết Pass. Trạng thái lịch sử BUG-001/002/003 được nhập với nhãn nguồn lịch sử, không bịa thời điểm các bước trung gian.
