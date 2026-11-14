# SmileCare — Hồ sơ dự án kiểm thử phần mềm

[![Kiểm tra QA](https://github.com/htrsng/KiemThu_PhongKham/actions/workflows/cypress.yml/badge.svg)](https://github.com/htrsng/KiemThu_PhongKham/actions/workflows/cypress.yml)

## 1. Tổng quan dự án

SmileCare là hệ thống quản lý phòng khám nha khoa, hỗ trợ quản lý bệnh nhân, bác sĩ, dịch vụ, lịch hẹn, tiếp đón, quá trình khám và thanh toán. Hệ thống phân quyền cho quản trị viên, bác sĩ và lễ tân để thực hiện công việc theo từng vai trò.

Quy trình chính gồm đặt lịch hẹn, check-in, cập nhật trạng thái điều trị, tạo hóa đơn và ghi nhận thanh toán. Ứng dụng sử dụng React/TypeScript cho giao diện, Express cho API và MongoDB để lưu trữ dữ liệu.

## 2. Phạm vi kiểm thử

| Nhóm chức năng | Phạm vi có bằng chứng |
| --- | --- |
| Xác thực và phân quyền | Kiểm tra đăng nhập/phiên làm việc; quyền của Admin, Doctor và Reception |
| Lịch hẹn và check-in | Điều kiện đặt lịch, thời gian/trạng thái check-in, chuyển trạng thái và hoàn thành lặp |
| Hóa đơn và thanh toán | Tính duy nhất hóa đơn, phương thức thanh toán, số tiền thực thu/công nợ và từ chối cập nhật sai |
| Hồ sơ học phần | 20 use case, có cả danh mục, doanh thu và tiền lương; kết quả cũ không tự xác nhận phạm vi đã kiểm thử trên build mới |

Cypress có các luồng kết hợp UI/API. Bộ hiện tại chưa xác minh lại mọi tính năng học phần hoặc mọi bước trên giao diện. Phạm vi và giới hạn được ghi trong từng README chuyên môn.

## 3. Tài liệu kiểm thử

| Nhóm | Nội dung |
| --- | --- |
| [Kiểm thử thủ công](manual-testing/README.md) | Kế hoạch, kịch bản, kỹ thuật, 337 case gốc/70 case tập trung, thực thi, báo cáo lỗi và RTM |
| [Kiểm thử API](api-testing/README.md) | Endpoint, trường hợp hợp lệ/không hợp lệ, xác thực/phân quyền, assertions, Postman/Newman và báo cáo |
| [Kiểm thử tự động](automation-testing/README.md) | Kịch bản Cypress, cấu trúc, dữ liệu riêng, phạm vi UI/API, CI và bằng chứng |

[Đặc tả](docs/requirements/LT2_N02_DacTa.pdf) và [tài liệu học phần](docs/academic/) được giữ để đối chiếu nguồn. Công cụ chạy test/báo cáo dùng chung nằm trong `.github/qa/`. [CONTRIBUTING.md](CONTRIBUTING.md) quy định cách quản lý bằng chứng và lỗi.

[Đối chiếu 6 bug với test case và mã kiểm thử](manual-testing/bug-reports/bug-testcase-map.md) giải thích trạng thái Open/Closed, lý do severity/priority và cách tính 46 API / 12 Cypress test.

## 4. Kết quả thực thi kiểm thử

**Nguồn trạng thái hiện hành:** [Tổng hợp QA mới nhất](manual-testing/test-execution/latest-qa-summary.md). Retest sau sửa BUG-005/006 đạt **65 Pass / 0 Fail**: 46 API, 12 Cypress UI/hybrid và 7 hồi quy BUG-002/003. Cả 6 bug trong registry đã Closed theo bằng chứng tương ứng; báo cáo trước sửa được giữ nguyên.

| Hồ sơ | Kết quả | Nguồn |
| --- | --- | --- |
| Excel gốc, ghi chú kiểm thử cuối ngày 14/06/2026 | 337 case / 20 use case; ghi nhận 337 Pass | [Workbook kết quả lịch sử](manual-testing/test-execution/history/manual-execution.xlsx) |
| Bảng tổng hợp trong PDF gốc | 314 case: 288 Pass / 26 Fail | [Báo cáo học phần, trang 36](docs/academic/LT2_N02_KiemThu.pdf#page=36) |
| Hồi quy nghiệp vụ mở rộng | 46 API + 12 UI + 7 test hồi quy BUG-002/003: **65 Pass / 0 Fail** | [Kết quả JSON](automation-testing/reports/runs/QA-20261114T164815189Z-178426/execution.json) |
| Biên controller và hạ tầng | **19 Pass**: 6 biên ±30 phút/lệch 1 ms và 13 reporting/lifecycle; không phải HTTP/manual | [Kết quả unit](automation-testing/reports/runs/QA-20261114T164835731Z-7ba849/unit-results.json) |
| Collection Postman chạy bằng Newman | 21 request; **46/46 assertions Pass** | [Kết quả Newman](api-testing/reports/newman/QA-20261114T164829754Z-c4f8d8/newman-results.json) |
| Bộ regression ưu tiên 40 case — kết quả đã ghi | **38 Pass / 1 Fail / 1 Blocked**; ảnh manual đang bổ sung | [Workbook đã điền](manual-testing/test-execution/manual-runs/MAN-20261114-01/manual-regression.xlsx) |

[CI trước sửa](https://github.com/htrsng/KiemThu_PhongKham/actions/runs/43455436873), head `420cc74`, từng Failed do 11 assertions của BUG-005/006. Retest local trên commit `1bb247a` đã đạt 65/65; trạng thái lần chạy GitHub mới nhất nằm ở badge đầu trang. [Sổ theo dõi lỗi](manual-testing/bug-reports/README.md) giữ lịch sử Fixed → Retest → Closed và bằng chứng trước/sau sửa.

Excel và PDF là hai hồ sơ lịch sử riêng; chênh lệch được giải thích trong [đối chiếu nguồn](docs/requirements/source-reconciliation.md). 70 thiết kế tập trung có chồng lấp với 337 case gốc; bộ manual 40 case là một tập con. Không cộng số thiết kế hoặc assertions tự động thành số case manual đã Pass.

Bộ 40 case đã ghi Actual và trạng thái trong workbook. `TC-PAY-016` Fail do phụ phí âm vẫn được thanh toán; `TC-APPT-014` Blocked do chưa xác minh thời điểm bằng nhau tuyệt đối. [Kết quả API/UI hỗ trợ](manual-testing/test-execution/assisted-runs/README.md) được giữ riêng; ảnh manual đang bổ sung. Mẫu `manual-regression.xlsx` ở thư mục tổng là mẫu tái sử dụng, không phải nguồn kết quả mới nhất.

## 5. Hướng dẫn chạy kiểm thử

Yêu cầu: Node.js 24, npm và MongoDB cục bộ cổng 27017. Chạy lệnh từ thư mục gốc:

```sh
npm ci --prefix server
npm ci --prefix client
npm ci --prefix automation-testing
npm ci --prefix api-testing/postman
```

Với bản tải mới, tạo môi trường QA một lần và seed tài khoản giả lập. Các lần sau dùng lại `.env.test` đang có; lệnh sinh môi trường sẽ ghi đè file này.

```sh
node .github/qa/scripts/prepare-env.js
node --env-file=.env.test .github/qa/scripts/seed-test-accounts.js
```

Mở API và frontend ở hai terminal riêng:

```sh
node --env-file=.env.test server/server.js
```

```sh
npm --prefix client run dev
```

Khi hai dịch vụ đã chạy:

```sh
node .github/qa/scripts/audit-qa.js
node .github/qa/scripts/run-unit.js
node --env-file=.env.test .github/qa/scripts/run-qa.js
node --env-file=.env.test .github/qa/scripts/run-postman.js
```

Test nghiệp vụ Fail hoặc test tự động chưa chạy làm QA trả lỗi; không bỏ qua test hồi quy lỗi. Cách chạy riêng API, Cypress có giao diện/headless và thực thi manual nằm trong ba README chuyên môn. Công cụ tạo dữ liệu yêu cầu dịch vụ loopback và tên database kết thúc bằng `_test`.
