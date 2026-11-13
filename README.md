# SmileCare — Dự án kiểm thử hệ thống quản lý phòng khám

[![Clinic QA Checks](https://github.com/htrsng/KiemThu_PhongKham/actions/workflows/cypress.yml/badge.svg)](https://github.com/htrsng/KiemThu_PhongKham/actions/workflows/cypress.yml)

Dự án QA học tập cho ứng dụng nha khoa React/TypeScript, Express và MongoDB. Hồ sơ gồm kiểm thử gốc theo 20 use case và bộ hồi quy API/Cypress trên phiên bản mã hiện tại.

## Cấu trúc hồ sơ

```text
KiemThu_PhongKham/
├── manual-testing/       # Test plan, scenarios, cases, execution, bugs và RTM
├── api-testing/          # API automated tests, Postman collection và reports
├── automation-testing/   # Cypress, fixtures và reports
├── docs/
│   ├── requirements/     # Đặc tả và đối chiếu nguồn
│   └── academic/         # Báo cáo cài đặt, kiểm thử và Excel học phần gốc
├── client/
├── server/
├── .github/
│   ├── workflows/
│   └── qa/               # Scripts, helpers và unit tests dùng chung
└── README.md
```

Bắt đầu từ [Manual testing](manual-testing/README.md), [API testing](api-testing/README.md) hoặc [Cypress automation](automation-testing/README.md). [Hạ tầng QA dùng chung](.github/qa/README.md) quản lý Run ID, báo cáo và lifecycle. Các run cũ giữ nguyên nội dung, hash và kết quả; [bảng chuyển đường dẫn](automation-testing/reports/legacy-paths.json) giúp tra các đường dẫn nguồn ghi trong hồ sơ cũ.

## Kết quả kiểm thử

| Đợt / nguồn | Kết quả | Báo cáo |
| --- | --- | --- |
| Excel kiểm thử gốc, ghi chú cuối 14/06/2026 | **337 case / 20 use case; 337 Pass theo kết quả đã ghi** | [Excel chuẩn hóa](manual-testing/test-execution/history/manual-execution.xlsx) · [CSV](manual-testing/test-execution/history/manual-execution.csv) |
| Báo cáo PDF gốc, tháng 6/2026 | **314 case: 288 Pass, 26 Fail** theo bảng tổng hợp | [PDF trang 36](docs/academic/LT2_N02_KiemThu.pdf#page=36) |
| Hồi quy sau sửa BUG-002/003 | **34 API + 12 Cypress + 7 defect regression: 53 Pass, 0 Fail** | [Test report](manual-testing/test-execution/test-report.md) · [Execution Excel](automation-testing/reports/runs/QA-20261113T124551346Z-2f0e1e/execution.xlsx) |
| Postman collection chạy bằng Newman | **21 request, 46/46 assertions Pass** | [Bằng chứng thực thi](api-testing/reports/newman/QA-20261113T124931337Z-ba424a/newman-results.json) |
| Manual regression trên build mới | **40 case ưu tiên: Not Run**, cần thực thi thủ công | [Workbook](manual-testing/test-execution/manual-regression.xlsx) · [Cách thực hiện](manual-testing/test-execution/manual-regression.md) |

Hai hồ sơ gốc có số liệu khác nhau; giữ riêng từng kết quả và [ghi rõ đối chiếu](docs/requirements/source-reconciliation.md). Kết quả cũ là kết quả lịch sử đã kiểm thử, không bị chuyển thành Not Run. `Not Run` trong workbook hồi quy chỉ nói đến các case chưa thực hiện lại trên build mới.

## Phạm vi và sản phẩm QA

- **UC1–UC4:** danh mục, lịch khám, tiếp đón/khám bệnh, thanh toán, tiền lương và báo cáo theo tài liệu gốc.
- [RTM 337 case](manual-testing/rtm/historical-rtm.csv) nối use case → trang đặc tả → mã liên quan → kết quả lịch sử → evidence và automation hiện tại.
- [Test plan](manual-testing/test-plan/test-plan.md), [bug register](manual-testing/bug-reports/README.md), báo cáo CSV/Excel/JSON và bằng chứng trước/sau sửa lỗi.
- API positive/negative/RBAC; Cypress có selector ổn định, dữ liệu riêng từng test và kiểm tra dữ liệu lưu sau thao tác.
- BUG-002/003/004 có bằng chứng trước/sau sửa và lifecycle Fixed → Retest → Closed; test vẫn giữ assertion nghiệp vụ, CI lưu artifacts khi Fail.
- Bốn case gốc thiếu trường đã được bổ sung ở [bản thiết kế chuẩn hóa](manual-testing/test-cases/source-corrections.json), không sửa kết quả lịch sử.

70 thiết kế focused trong `manual-testing/test-cases/test-cases.csv` hỗ trợ automation và có nội dung chồng lấp với 337 case gốc; không cộng thành 407 scenario độc lập. Hồi quy mới ưu tiên đăng nhập, phân quyền, lịch hẹn/check-in và thanh toán; chưa xác nhận lại toàn bộ 20 use case.

## Kiến trúc kiểm thử

```mermaid
flowchart LR
  Source[Đặc tả và báo cáo cài đặt] --> Cases[337 case gốc]
  Cases --> History[Kết quả kiểm thử lịch sử]
  Cases --> Regression[Hồi quy API và Cypress]
  Regression --> Reports[Run ID, build, actual và evidence]
  Reports --> Bugs[Bug report và retest]
  CI[GitHub Actions] --> Regression
```

## Chạy dự án

Yêu cầu Node.js 24, npm và MongoDB local cổng 27017. Từ thư mục gốc:

```sh
npm ci --prefix server
npm ci --prefix client
npm ci --prefix automation-testing
npm ci --prefix api-testing/postman
node .github/qa/scripts/prepare-env.js
node --env-file=.env.test .github/qa/scripts/seed-test-accounts.js
```

Mở backend và frontend ở hai terminal:

```sh
node --env-file=.env.test server/server.js
```

```sh
npm --prefix client run dev
```

Chạy hồi quy khi API/UI sẵn sàng:

```sh
node .github/qa/scripts/audit-qa.js
node --env-file=.env.test .github/qa/scripts/run-qa.js
node --env-file=.env.test .github/qa/scripts/run-postman.js
```

Mỗi test Fail, chưa chạy hoặc lỗi tiến trình làm QA trả exit code 1; không bỏ qua defect regression để làm CI xanh. Newman cũng trả nonzero khi có request/script/assertion thất bại. [Hướng dẫn QA](manual-testing/README.md) ghi vị trí báo cáo và cách chạy riêng suite.

Khi khởi động, backend tạo unique index trên `Invoice.appointmentId`. Nếu DB cũ có hóa đơn trùng, backend dừng và báo lỗi index; cần đối chiếu hồ sơ tài chính trước khi xử lý, không tự xóa/gộp dữ liệu. Cơ chế hoàn thành cho phép retry để khôi phục hóa đơn thiếu sau lỗi ghi; không phải transaction nguyên tử giữa hai collection.

## Nguồn và đóng góp

[Đặc tả](docs/requirements/LT2_N02_DacTa.pdf), [cài đặt](docs/academic/LT2_N02_CaiDat-1.pdf), [báo cáo kiểm thử](docs/academic/LT2_N02_KiemThu.pdf) và Excel gốc được giữ để truy xuất nguồn. [Chỉ mục hồ sơ lịch sử](manual-testing/test-execution/history/README.md) phân biệt dữ liệu gốc, phần chuẩn hóa và hồi quy mới.

Báo cáo gốc phân công Nguyễn Thị Huyền Trang làm kế hoạch, test case, manual/website testing và automation. Ứng dụng `client/`/`server/` là đối tượng kiểm thử; phần chuẩn hóa và automation bổ sung có AI hỗ trợ. Không nhận toàn bộ phần mềm là sản phẩm cá nhân tự phát triển. Không commit credential hoặc dữ liệu bệnh nhân thật.
