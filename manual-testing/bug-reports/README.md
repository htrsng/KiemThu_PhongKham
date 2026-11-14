# Bug register

[Bảng bug ↔ test case và hướng dẫn giải thích khi phỏng vấn](bug-testcase-map.md) nêu rõ 6 bug, hai trạng thái Open, lý do severity/priority và cách tính 46 API / 12 Cypress test.

| ID | Tóm tắt | Severity | Priority | Trạng thái | Bằng chứng |
| --- | --- | --- | --- | --- | --- |
| [BUG-001](BUG-001.md) | Sai mật khẩu làm mất thông báo lỗi trên form | Medium | P1 | Closed, theo CI lịch sử | [Chi tiết](BUG-001.md) |
| [BUG-002](BUG-002.md) | PATCH cho phép lùi trạng thái lịch đã hoàn thành | High | P1 | Closed sau retest | [Trước](../../automation-testing/reports/runs/QA-20261113T124125327Z-5e0311/execution.json) · [Sau](../../automation-testing/reports/runs/QA-20261113T124551346Z-2f0e1e/execution.json) |
| [BUG-003](BUG-003.md) | Hoàn thành lặp tạo trùng hóa đơn | High | P0 | Closed sau retest | [Trước](../../automation-testing/reports/runs/QA-20261113T124125327Z-5e0311/execution.json) · [Sau](../../automation-testing/reports/runs/QA-20261113T124551346Z-2f0e1e/execution.json) |
| [BUG-004](BUG-004.md) | UI thanh toán không lưu số tiền đã thu | High | P1 | Closed sau Fixed/Retest | [Trước](../../automation-testing/reports/runs/QA-20261113T072849286Z-115a62/execution.json) · [Sau](../../automation-testing/reports/runs/QA-20261113T073749688Z-18594c/execution.json) |
| [BUG-005](BUG-005.md) | Doctor đọc/cập nhật lịch bác sĩ khác | High | P0 | Open | [Run mới](../../automation-testing/reports/runs/QA-20261113T153459634Z-3e9268/execution.json) |
| [BUG-006](BUG-006.md) | Đầu vào thiếu/ID sai trả HTTP 500 | Medium | P2 | Open | [Run mới](../../automation-testing/reports/runs/QA-20261113T153459634Z-3e9268/execution.json) |

Tổng hiện hành: **6 bug, 4 Closed / 2 Open**. BUG-002/003/004 giữ trạng thái Closed theo retest cũ. Bộ mở rộng có 65 test nghiệp vụ: 54 Pass / 11 Fail; 11 Fail thuộc BUG-005/006 mới tái hiện, không phải tái mở hai lỗi trạng thái/hóa đơn. Manual regression 40 case vẫn Not Run. Xem [registry](registry.json), [tổng hợp mới nhất](../test-execution/latest-qa-summary.md) và [báo cáo lịch sử](../test-execution/test-report.md).

Quy tắc lifecycle: New → Open → Fixed → Retest → Closed; Retest thất bại → Reopened → Open/Fixed. `.github/qa/scripts/defect.js` yêu cầu actor, note và evidence. Fixed cần commit tồn tại; Retest cần build có commit sửa; Closed chỉ chấp nhận run Retest có tất cả assertion liên kết Pass. Trạng thái lịch sử BUG-001/002/003 được nhập với nhãn nguồn lịch sử, không bịa thời điểm các bước trung gian.
