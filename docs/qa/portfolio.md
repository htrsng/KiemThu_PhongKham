# Hồ sơ dự án cho CV và phỏng vấn

## Cách trình bày phạm vi đóng góp

SmileCare là dự án học tập cá nhân phục vụ portfolio QA. Ứng dụng React/Express là đối tượng kiểm thử. Trọng tâm công việc là phân tích luồng và rủi ro, thiết kế test, chuẩn bị data, kiểm tra API/UI, ghi nhận lỗi và báo cáo bằng chứng. Không mô tả toàn bộ ứng dụng là sản phẩm tự phát triển nếu không có căn cứ về phần đóng góp đó.

Việc rà soát, viết/refactor automation và chuẩn hóa tài liệu có AI hỗ trợ. Người dùng dự án cần đọc, chạy lại và giải thích được fixture, assertion, lỗi và giới hạn trước khi dùng trong phỏng vấn. Không nhận đã thực thi manual hoặc tự phát hiện độc lập mọi lỗi nếu chưa trực tiếp làm các việc đó.

## Nội dung CV có thể dùng sau khi tự chạy lại

**SmileCare — Dự án kiểm thử ứng dụng phòng khám | Personal QA Project**  
**Công cụ:** Manual test design, Postman, JavaScript/Node.js, Cypress, MongoDB, GitHub Actions, Git.

- Thiết kế 70 test case và RTM cho 31 yêu cầu, áp dụng EP, BVA, State Transition, Decision Table và RBAC; phân biệt coverage thiết kế với thực thi.
- Xây dựng và chạy bộ regression gồm 26 API test và 10 Cypress UI test với dữ liệu riêng từng test, kiểm tra trạng thái lưu sau thao tác và xuất báo cáo TAP/JUnit/HTML.
- Viết báo cáo và ca tái hiện hai lỗi nghiệp vụ: lùi trạng thái lịch đã hoàn thành và tạo trùng hóa đơn; lưu expected/actual cùng log thực thi.
- Cấu hình GitHub Actions chạy QA và lưu báo cáo, screenshot/video; tách ca lỗi đã biết khỏi regression và công khai giới hạn kiểm thử.

Nếu chưa tự chạy/giải thích automation, thay “Xây dựng và chạy” bằng “Tham gia hoàn thiện bộ kiểm thử tự động có AI hỗ trợ”. Không ghi “70 test Pass”, “100% coverage”, “CI mới đã xanh” hoặc kinh nghiệm làm việc thực tế từ dữ liệu này.

## Demo trong 5–7 phút

1. Mở README: nêu bốn module ưu tiên và lý do ưu tiên lỗi sai quyền/sai tiền.
2. Mở một manual case và RTM; giải thích kỹ thuật thiết kế, tiền điều kiện và oracle.
3. Chạy `node --env-file=testing/.env.test testing/scripts/run-api.js`; đọc tên test, status và dữ liệu GET lại.
4. Mở Cypress UI hoặc [ảnh check-in](evidence/2026-11-13/reception-checkin-persisted.png), giải thích request alias và persisted state.
5. Chạy suite `--known-defects`: giải thích vì sao Fail là phát hiện hữu ích, mở BUG-003 và kiểm tra hai invoice.
6. Mở [test summary](test-report.md); nêu 36 Pass, 2 Fail, manual chưa chạy và lý do chưa kết luận release-ready.

## Việc cần người kiểm thử tự thực hiện

Workbook [test-execution.xlsx](test-execution.xlsx) có 70 dòng Not Run, dropdown trạng thái và cột actual/bug/evidence. Ưu tiên AUTH → AUTHZ → APPT → PAY; ghi tester, ngày giờ/múi giờ, revision và bằng chứng cho từng lần chạy. Các kết quả tự động hiện có không được điền thay cho execution manual.

Chạy lại workflow trên GitHub sau khi push và liên kết run mới khi thật sự có kết quả. Các thay đổi local hiện tại chưa chứng minh CI mới đã thành công. Khi BUG-002/003 được sửa, chạy retest và regression trước khi đổi trạng thái Open.
