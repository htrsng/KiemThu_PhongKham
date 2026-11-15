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
| Các nhóm chức năng đã kiểm thử trước đó | 20 use case, gồm danh mục, doanh thu và tiền lương; kết quả theo đợt kiểm thử trước |

Cypress có các luồng kết hợp UI/API. Bộ hồi quy hiện tại tập trung vào những nghiệp vụ đã liệt kê; phạm vi và giới hạn được ghi trong từng README chuyên môn.

## 3. Tài liệu kiểm thử

| Nhóm | Nội dung |
| --- | --- |
| [Kiểm thử thủ công](manual-testing/README.md) | Kế hoạch, kịch bản, kỹ thuật, 337 case gốc/70 case tập trung, thực thi, báo cáo lỗi và RTM |
| [Kiểm thử API](api-testing/README.md) | Endpoint, trường hợp hợp lệ/không hợp lệ, xác thực/phân quyền, assertions, Postman/Newman và báo cáo |
| [Kiểm thử tự động](automation-testing/README.md) | Kịch bản Cypress, cấu trúc, dữ liệu riêng, phạm vi UI/API, CI và bằng chứng |

[Đặc tả yêu cầu](docs/requirements/LT2_N02_DacTa.pdf) và [tài liệu dự án ban đầu](docs/academic/) được giữ để đối chiếu nguồn. Công cụ chạy test/báo cáo dùng chung nằm trong `.github/qa/`. [CONTRIBUTING.md](CONTRIBUTING.md) quy định cách quản lý bằng chứng và lỗi.

[Đối chiếu 6 bug với test case và mã kiểm thử](manual-testing/bug-reports/bug-testcase-map.md) giải thích trạng thái Open/Closed, lý do severity/priority và cách tính 46 API / 12 Cypress test.

## 4. Kết quả thực thi kiểm thử

**Nguồn trạng thái hiện hành:** [Tổng hợp QA mới nhất](manual-testing/test-execution/latest-qa-summary.md). Retest sau sửa BUG-005/006 đạt **65 Pass / 0 Fail**: 46 API, 12 Cypress UI/hybrid và 7 hồi quy BUG-002/003. Cả 6 bug trong registry đã Closed theo bằng chứng tương ứng; báo cáo trước sửa được giữ nguyên.

| Nhóm kiểm thử | Kết quả thực thi | Báo cáo kết quả |
| --- | --- | --- |
| Kiểm thử chức năng — đợt trước | **337 test case / 20 use case; 337 Pass** | [Kết quả thực thi Excel](manual-testing/test-execution/history/manual-execution.xlsx) |
| Kiểm thử hồi quy tự động — Node API và Cypress | 46 Node API test + 12 Cypress UI/hybrid test + 7 test hồi quy lỗi: **65 Pass / 0 Fail** | [Báo cáo hồi quy](automation-testing/reports/runs/QA-20261114T164815189Z-178426/execution.json) |
| Kiểm thử đơn vị — controller và công cụ QA | **19 Pass**: 6 test biên thời gian check-in và 13 test báo cáo/vòng đời lỗi | [Báo cáo unit test](automation-testing/reports/runs/QA-20261114T164835731Z-7ba849/unit-results.json) |
| Kiểm thử API — Postman/Newman | 21 request; **46/46 assertions Pass** (phép kiểm tra kết quả, không phải 46 test case) | [Báo cáo Newman](api-testing/reports/newman/QA-20261114T164829754Z-c4f8d8/newman-results.json) |
| Kiểm thử hồi quy ưu tiên — 40 test case | **38 Pass / 1 Fail / 1 Blocked** | [Kết quả thực thi Excel](manual-testing/test-execution/manual-runs/MAN-20261114-01/manual-regression.xlsx) |

**GitHub Actions: [Success — run 43617738189](https://github.com/htrsng/KiemThu_PhongKham/actions/runs/43617738189)** trên commit `01a9c67`. Workflow đã đạt các bước kiểm tra tài liệu, unit, build giao diện, API/Cypress, kiểm tra evidence và Newman. [Sổ theo dõi lỗi](manual-testing/bug-reports/README.md) lưu quá trình Fixed → Retest → Closed và bằng chứng trước/sau sửa BUG-005/006.

**Excel là nguồn số liệu của đợt kiểm thử chức năng trước:** 337 test case thuộc 20 use case, ghi nhận 337 Pass. Bộ hồi quy ưu tiên 40 case là tập con và có workbook thực thi riêng; 70 thiết kế tập trung cũng có chồng lấp với bộ 337 case. Các nhóm trong bảng có thể kiểm tra cùng nghiệp vụ bằng những cách khác nhau, vì vậy không cộng các dòng thành tổng số test case độc lập. Unit test dùng persistence mock; Cypress gồm các luồng UI/API kết hợp.

**337, 70 và 40 là ba phạm vi khác nhau:** 337 là bộ chức năng từ Excel đợt trước; [70 case tập trung](manual-testing/test-cases/test-cases.csv) là bộ thiết kế hồi quy hiện tại; [40 case ưu tiên](manual-testing/test-cases/regression-suite.csv) được chọn từ bộ 70 để thực thi. Con số “70 test case” trong phần mô tả dự án cần ghi rõ là **bộ thiết kế hồi quy 70 case**, không phải tổng số case của dự án hoặc 70 case đã Pass.

**337 Pass và 6 bug không thuộc cùng một bảng kết quả thực thi.** Excel ghi kết quả của đợt trước; [registry 6 bug](manual-testing/bug-reports/registry.json) lưu nguồn phát hiện và bằng chứng của từng lỗi, trong đó BUG-001 có trạng thái nhập từ hồ sơ cũ. Chưa có bằng chứng xác nhận toàn bộ 337 case được chạy lại sau khi sửa cả 6 bug, nên không mô tả 337 Pass là kết quả retest của chúng. Kết quả retest sau sửa BUG-005/006 được xác minh ở bộ tự động 65 test; các báo cáo Fail trước sửa vẫn được giữ nguyên.

**46 Node API test và 46 Newman assertions là hai đơn vị khác nhau:** bộ Node chạy 46 test tự động; collection Postman chạy 21 request với 46 assertions. Hai bộ có chồng lấp nghiệp vụ, không cộng thành 92 API test case độc lập.

Bộ 40 case ghi nhận `TC-PAY-016` Fail do phụ phí âm vẫn được thanh toán và `TC-APPT-014` Blocked do chưa xác minh thời điểm bằng nhau tuyệt đối. [Kết quả API/UI hỗ trợ](manual-testing/test-execution/assisted-runs/README.md) có hồ sơ riêng. Workbook kết quả trong bảng là nguồn của đợt thực thi; `manual-regression.xlsx` ở thư mục tổng là mẫu tái sử dụng.

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
