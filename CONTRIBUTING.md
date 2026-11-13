# Quy ước đóng góp

Sử dụng thống nhất các mục điều hướng và đường dẫn trong [tổng quan dự án](README.md): [Kiểm thử thủ công](manual-testing/README.md), [Kiểm thử API](api-testing/README.md) và [Kiểm thử tự động](automation-testing/README.md).

## Vai trò các thư mục

| Vị trí | Nội dung |
| --- | --- |
| `manual-testing/` | Kế hoạch, kịch bản, test case, thực thi, báo cáo lỗi và RTM |
| `api-testing/` | Test API Node, Postman/Newman và chỉ mục báo cáo API |
| `automation-testing/` | Spec/support Cypress, fixture dữ liệu dùng chung và báo cáo |
| `docs/requirements/`, `docs/academic/` | Đặc tả, đối chiếu nguồn và tài liệu học phần gốc |
| `.github/qa/`, `.github/workflows/` | Runner/công cụ báo cáo dùng chung và CI |
| `client/`, `server/` | Ứng dụng được kiểm thử |

## Quy tắc kiểm thử và bằng chứng

- Dùng dữ liệu giả, dịch vụ loopback và database QA kết thúc bằng `_test`. Không commit `.env.test`, mật khẩu, token, dữ liệu bệnh nhân thật hoặc thư viện đã cài.
- Mỗi test tự động cần assertions cho kết quả quan sát được, dữ liệu riêng và cleanup theo ID sở hữu. Kiểm tra dữ liệu đã lưu sau thao tác nghiệp vụ khi phù hợp.
- `manual-testing/test-cases/source-cases.csv` giữ 337 case lịch sử; kết quả lịch sử ở `manual-testing/test-execution/history/`. Bộ 70 case tập trung có chồng lấp; bộ 40 case là tập con ưu tiên. Không cộng các số lượng này hoặc kế thừa Pass lịch sử cho retest build mới.
- Ghi thực thi manual thật với build, ngày giờ, người thực hiện, Expected, Actual, trạng thái, Bug ID và bằng chứng. Automation Partial không có nghĩa toàn bộ case đã Pass manual.
- Mỗi run tự động có Run ID/build/người chạy và thư mục riêng. Không sửa kết quả đã công bố. Giữ bằng chứng Trước sửa, Sau sửa và Hồi quy; dùng `automation-testing/reports/legacy-paths.json` để tìm đường dẫn từ hồ sơ cũ.
- Dùng định danh `BUG-xxx`, `TC-AREA-xxx`, `REQ-AREA-xxx`. Lỗi cần bước tái hiện, expected/actual, môi trường và bằng chứng. Giữ mã học phần gốc khi nhập dữ liệu nguồn.
- Severity: Critical — mất dữ liệu/chặn hệ thống; High — ảnh hưởng nghiệp vụ lớn; Medium — có ảnh hưởng nhưng có cách khắc phục tạm; Low — ảnh hưởng nhỏ. Priority: P0 — chặn phát hành; P1 — chu kỳ hiện tại; P2 — chu kỳ sau; P3 — backlog.
- Vòng đời: New → Open → Fixed → Retest → Closed; retest thất bại chuyển Reopened. Không xóa assertions để đổi Fail thành Pass. Công cụ lifecycle yêu cầu kiểm tra commit sửa/bằng chứng trước khi đóng lỗi.

## Kiểm tra thay đổi

Chạy từ thư mục gốc sau khi [cài đặt dự án](README.md#5-hướng-dẫn-chạy-kiểm-thử):

```sh
node .github/qa/scripts/audit-qa.js
node .github/qa/scripts/run-unit.js
```

Với thay đổi hành vi ứng dụng, test hoặc cấu hình runner, chạy thêm các suite API/Cypress/Newman liên quan và build frontend khi cần. Thay đổi chỉ ở tài liệu cần kiểm tra liên kết, đường dẫn và tính thống nhất của thông tin; sửa README không được coi là một lần thực thi test nghiệp vụ mới.

Audit run đã hoàn thành bằng `node .github/qa/scripts/audit-run.js <run-directory>`. Đầu ra chạy nằm trong `automation-testing/reports/generated/` và bị Git bỏ qua; công bố bằng chứng được chọn qua [script QA dùng chung](.github/qa/README.md), không ghi đè Run ID đã công bố. Giữ nguyên các chỉnh sửa workbook manual đang làm dở.

[Tổng hợp QA mới nhất](manual-testing/test-execution/latest-qa-summary.md) được sinh từ các run hoàn tất bằng `update-latest-summary.js`. Khi thay đổi registry hoặc công bố run mới, cập nhật trang này và README hiện hành; không sửa báo cáo lịch sử. Unit controller dùng persistence mock phải ghi riêng khỏi HTTP/UI và manual execution.
