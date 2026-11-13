# Bug register

| ID | Tóm tắt | Severity | Priority | Trạng thái | Bằng chứng |
| --- | --- | --- | --- | --- | --- |
| [BUG-001](bugs/BUG-001.md) | Sai mật khẩu làm mất thông báo lỗi trên form | Medium | P1 | Closed, theo CI lịch sử | [Chi tiết](bugs/BUG-001.md) |
| [BUG-002](bugs/BUG-002.md) | PATCH cho phép lùi trạng thái lịch đã hoàn thành | High | P1 | Open | [TAP](evidence/2026-11-13/known-defects-results.tap) |
| [BUG-003](bugs/BUG-003.md) | Hoàn thành lặp tạo trùng hóa đơn | High | P0 | Open | [TAP](evidence/2026-11-13/known-defects-results.tap) |

Tổng: **3 bug, 1 Closed, 2 Open**. Hai lỗi mới được xác minh ngày 13/11/2026 trên dữ liệu QA cục bộ. Chưa sửa mã ứng dụng cho hai lỗi này; test vẫn giữ assertion theo yêu cầu và trả Fail. Xem [test report](test-report.md) trước khi đánh dấu đóng lỗi.
