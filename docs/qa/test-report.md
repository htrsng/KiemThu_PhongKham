# Test report

## Phạm vi báo cáo

Báo cáo này chỉ tính kết quả có bằng chứng thực thi. Các test case trong
`testing/manual/test-cases.tsv` và collection Postman là thiết kế/chuẩn bị,
không tự động được tính là đã Pass.

## Kết quả đã xác minh

| Bộ kiểm thử | Kết quả | Môi trường |
| --- | --- | --- |
| API đăng nhập và phiên | 8/8 Pass | GitHub Actions, MongoDB QA riêng |
| Cypress đăng nhập | 5/5 Pass | GitHub Actions, Electron headless |
| Frontend production build | Pass | Node.js 24 |
| Node.js automation syntax | Pass | Node.js 24 |

**Tổng kết bằng chứng hiện có:** 13 test runtime Pass trong lần CI được ghi nhận.
Ngoài ra, repository đã chuẩn bị thêm 10 API case và 12 Cypress workflow/RBAC case,
nhưng chưa được đưa vào con số Pass này nếu chưa có log chạy tương ứng.

## Bằng chứng

- [Verification log](./verification.md)
- [Workflow CI đã xác minh](https://github.com/htrsng/KiemThu_PhongKham/actions/runs/42179238371)
- Artifact `clinic-qa-evidence` của workflow chứa log, ảnh và video khi có lỗi.

## Giới hạn

Không suy ra độ bao phủ toàn hệ thống từ các kết quả trên. Các module lịch hẹn,
check-in, phân quyền và thanh toán đã có test automation trong repo nhưng cần một
lần chạy CI thành công riêng để cập nhật số liệu thực thi tại đây.
