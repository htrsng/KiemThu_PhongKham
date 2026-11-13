# SmileCare — Hồ sơ dự án kiểm thử phần mềm

[![Kiểm tra QA](https://github.com/htrsng/KiemThu_PhongKham/actions/workflows/cypress.yml/badge.svg)](https://github.com/htrsng/KiemThu_PhongKham/actions/workflows/cypress.yml)

## 1. Tổng quan dự án

SmileCare là hệ thống quản lý phòng khám nha khoa trong đồ án học phần, sử dụng React/TypeScript, Express và MongoDB. Kho mã trình bày công việc QA phục vụ ứng tuyển **Thực tập sinh Kiểm thử phần mềm**: phân tích yêu cầu, thiết kế kiểm thử, kết quả thực thi lịch sử, báo cáo lỗi, kiểm thử API và hồi quy bằng Cypress.

Ứng dụng trong `client/` và `server/` là đối tượng kiểm thử. Hồ sơ QA được chia thành `manual-testing/`, `api-testing/` và `automation-testing/`.

## 2. Trách nhiệm QA của tôi

Trong đồ án nhóm, tôi được phân công lập kế hoạch, thiết kế test case, kiểm thử thủ công/website và kiểm thử tự động. Hồ sơ này trình bày công việc đó cùng các phần hoàn thiện sau học phần:

- Phân tích yêu cầu, thiết kế trường hợp hợp lệ/không hợp lệ bằng phân vùng tương đương, phân tích giá trị biên, bảng quyết định và chuyển trạng thái.
- Giữ kết quả thực thi học phần, có truy xuất về tài liệu nguồn.
- Ghi nhận lỗi có thể tái hiện, kèm mức độ nghiêm trọng, độ ưu tiên, kết quả mong đợi/thực tế và bằng chứng.
- Duy trì hồi quy API/Cypress, kiểm tra dữ liệu đã lưu và bằng chứng trước/sau sửa lỗi.
- Chuẩn bị bộ manual regression ưu tiên; việc thực thi bộ này trên build mới **vẫn chưa hoàn thành**.

Nguồn đóng góp nhóm và các phần có AI hỗ trợ được trình bày tại [Bối cảnh dự án](#7-bối-cảnh-dự-án).

## 3. Phạm vi kiểm thử

| Nhóm chức năng | Phạm vi có bằng chứng |
| --- | --- |
| Xác thực và phân quyền | Kiểm tra đăng nhập/phiên làm việc; quyền của Admin, Doctor và Reception |
| Lịch hẹn và check-in | Điều kiện đặt lịch, thời gian/trạng thái check-in, chuyển trạng thái và hoàn thành lặp |
| Hóa đơn và thanh toán | Tính duy nhất hóa đơn, phương thức thanh toán, số tiền thực thu/công nợ và từ chối cập nhật sai |
| Hồ sơ học phần | 20 use case, có cả danh mục, doanh thu và tiền lương; kết quả cũ không tự xác nhận phạm vi đã kiểm thử trên build mới |

Cypress có các luồng kết hợp UI/API. Bộ hiện tại chưa xác minh lại mọi tính năng học phần hoặc mọi bước trên giao diện. Phạm vi và giới hạn được ghi trong từng README chuyên môn.

## 4. Tài liệu kiểm thử

| Nhóm | Nội dung |
| --- | --- |
| [Kiểm thử thủ công](manual-testing/README.md) | Kế hoạch, kịch bản, kỹ thuật, 337 case gốc/70 case tập trung, thực thi, báo cáo lỗi và RTM |
| [Kiểm thử API](api-testing/README.md) | Endpoint, trường hợp hợp lệ/không hợp lệ, xác thực/phân quyền, assertions, Postman/Newman và báo cáo |
| [Kiểm thử tự động](automation-testing/README.md) | Kịch bản Cypress, cấu trúc, dữ liệu riêng, phạm vi UI/API, CI và bằng chứng |

[Đặc tả](docs/requirements/LT2_N02_DacTa.pdf) và [tài liệu học phần](docs/academic/) được giữ để đối chiếu nguồn. Công cụ chạy test/báo cáo dùng chung nằm trong `.github/qa/`. [CONTRIBUTING.md](CONTRIBUTING.md) quy định cách quản lý bằng chứng và lỗi.

## 5. Kết quả thực thi kiểm thử

| Hồ sơ | Kết quả | Nguồn |
| --- | --- | --- |
| Excel gốc, ghi chú kiểm thử cuối ngày 14/06/2026 | 337 case / 20 use case; ghi nhận 337 Pass | [Workbook kết quả lịch sử](manual-testing/test-execution/history/manual-execution.xlsx) |
| Bảng tổng hợp trong PDF gốc | 314 case: 288 Pass / 26 Fail | [Báo cáo học phần, trang 36](docs/academic/LT2_N02_KiemThu.pdf#page=36) |
| Hồi quy nghiệp vụ tự động | 34 API + 12 UI + 7 test hồi quy lỗi: **53 Pass, 0 Fail** | [Kết quả JSON](automation-testing/reports/runs/QA-20261113T124551346Z-2f0e1e/execution.json) |
| Collection Postman chạy bằng Newman | 21 request; **46/46 assertions Pass** | [Kết quả Newman](api-testing/reports/newman/QA-20261113T124931337Z-ba424a/newman-results.json) |
| Manual regression ưu tiên trên build mới | 40 case: **Not Run** | [Workbook thực thi](manual-testing/test-execution/manual-regression.xlsx) |

[CI đã xác minh sau khi đổi cấu trúc](https://github.com/htrsng/KiemThu_PhongKham/actions/runs/43438419642), commit `9b0a162`, xác nhận riêng 53 test nghiệp vụ và 46 assertions Newman Pass. BUG-002/003/004 có bằng chứng sửa lỗi và retest trong [sổ theo dõi lỗi](manual-testing/bug-reports/README.md).

Excel và PDF là hai hồ sơ lịch sử riêng; chênh lệch được giải thích trong [đối chiếu nguồn](docs/requirements/source-reconciliation.md). 70 thiết kế tập trung có chồng lấp với 337 case gốc; bộ manual 40 case là một tập con. Không cộng số thiết kế hoặc assertions tự động thành số case manual đã Pass.

## 6. Hướng dẫn chạy kiểm thử

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
node --env-file=.env.test .github/qa/scripts/run-qa.js
node --env-file=.env.test .github/qa/scripts/run-postman.js
```

Test nghiệp vụ Fail hoặc test tự động chưa chạy làm QA trả lỗi; không bỏ qua test hồi quy lỗi. Cách chạy riêng API, Cypress có giao diện/headless và thực thi manual nằm trong ba README chuyên môn. Công cụ tạo dữ liệu yêu cầu dịch vụ loopback và tên database kết thúc bằng `_test`.

## 7. Bối cảnh dự án

Dự án bắt nguồn từ đồ án nhóm trong học phần. [Báo cáo kiểm thử gốc](docs/academic/LT2_N02_KiemThu.pdf#page=2) phân công Nguyễn Thị Huyền Trang phụ trách các công việc QA; phần ứng dụng và kết quả học phần có đóng góp của các thành viên trong nhóm. Mã client/server được giữ để tái hiện kiểm thử, không trình bày là phần mềm do một cá nhân tự phát triển toàn bộ.

Các phần chuẩn hóa nguồn, cải tiến automation/báo cáo và sửa lỗi sau học phần có AI hỗ trợ. File học phần gốc và bằng chứng đã công bố được giữ nguyên; kết quả trên build mới có Run ID/build riêng. Không đổi kết quả lịch sử thành một lần thực thi manual mới.
