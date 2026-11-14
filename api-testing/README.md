# Kiểm thử API

[Tổng quan dự án](../README.md) | [Kiểm thử thủ công](../manual-testing/README.md) | [Kiểm thử tự động](../automation-testing/README.md)

## 1. Tổng quan

Kiểm thử API xác minh xác thực, phân quyền và nghiệp vụ phòng khám trên ứng dụng Express/MongoDB. Bộ Node gồm **46 test API HTTP và 7 test hồi quy BUG-002/003**. Bộ HTTP mở rộng hiện có 35 Pass / 11 Fail, phát hiện BUG-005/006. Collection Postman và unit controller được báo cáo riêng. [Tổng hợp QA mới nhất](../manual-testing/test-execution/latest-qa-summary.md) là nguồn trạng thái hiện hành.

## 2. Phạm vi API

| Nhóm | Endpoint tiêu biểu | Assertions đã kiểm tra |
| --- | --- | --- |
| Xác thực | POST `/auth/login`, GET `/auth/me` | HTTP status, token/phiên làm việc, vai trò, không trả mật khẩu, từ chối token thiếu/sai/hết hạn |
| Phân quyền | GET `/accounts`; GET/PATCH/DELETE `/invoices/:id` | Quyền Admin/Doctor/Reception; cập nhật bị cấm không làm đổi dữ liệu |
| Quyền theo bác sĩ | GET danh sách/chi tiết, PATCH `/appointments/:id` với tài khoản Doctor có referenceId riêng | Ba assertions về lịch bác sĩ khác Fail, ghi BUG-005 |
| Đặt lịch/check-in | POST `/appointments`, PATCH `/appointments/:id/checkin` | Tạo hợp lệ, từ chối lịch quá khứ/trùng, quy tắc giờ/trạng thái và checkInTime đã lưu |
| Trạng thái điều trị | PUT/PATCH `/appointments/:id`, PATCH `/appointments/:id/finish` | Chuyển tiến, từ chối chuyển sai, hoàn thành lặp và đồng thời |
| Hóa đơn/thanh toán | GET `/invoices?appointmentId=:id`, PATCH/DELETE `/invoices/:id` | Hóa đơn duy nhất, phương thức thanh toán, số tiền thực thu/công nợ, số tiền âm/thiếu và quyền xóa |
| Dữ liệu thiếu/ID sai | POST thiếu doctorId/patientId/startTime/endTime, doctorId/startTime sai định dạng; GET/PATCH/check-in ID sai | Một Pass, tám Fail; kỳ vọng 4xx và không tạo/sửa dữ liệu, ghi BUG-006 |

[Hợp đồng API và checklist](api-contract.md) ghi đầu vào, response kỳ vọng và các nhánh chưa kiểm tra. Base URL: `http://localhost:5000/api`. Bảng trên mô tả assertions đã kiểm tra, không khẳng định bao phủ toàn bộ endpoint/nhánh xử lý.

## 3. Các loại kiểm thử

- **Trường hợp hợp lệ:** đăng nhập, đặt lịch, check-in, hoàn thành và lưu thanh toán đúng.
- **Trường hợp không hợp lệ:** thiếu thông tin đăng nhập, email/mật khẩu sai, lịch quá khứ/trùng, chuyển trạng thái sai và số tiền âm/thiếu.
- **Xác thực:** token thiếu, sai hoặc ký hợp lệ nhưng hết hạn; response không chứa mật khẩu.
- **Phân quyền:** cho phép/từ chối theo vai trò, đọc lại dữ liệu sau cập nhật bị từ chối.
- **Hồi quy nghiệp vụ:** hoàn thành có tính idempotent, 12 request hoàn thành đồng thời, hóa đơn duy nhất và bảo toàn hóa đơn đã thanh toán.

Sáu unit test controller dùng đồng hồ cố định kiểm tra đúng ±30 phút và lệch 1 ms, với persistence mock. Chạy `node .github/qa/scripts/run-unit.js` để lấy TAP/JUnit riêng; không tính sáu test này vào 46 test HTTP hoặc manual execution.

Assertions kiểm tra HTTP **và dữ liệu nghiệp vụ đã lưu** bằng GET sau thao tác. BUG-002 yêu cầu HTTP 400 cùng trạng thái hoàn thành giữ nguyên; BUG-003 yêu cầu đúng một hóa đơn. Chỉ gửi request mà không kiểm tra kết quả không được tính là test tự động.

## 4. Công cụ và cấu trúc kiểm thử

| Vị trí | Vai trò |
| --- | --- |
| [automated-tests/](automated-tests/) | Node.js `node:test` / `node:assert/strict`: xác thực, phân quyền, lịch hẹn/hóa đơn và hồi quy lỗi |
| [postman/](postman/) | Collection có thể import, mẫu environment chưa điền thông tin đăng nhập, package Newman và lockfile |
| [Script QA dùng chung](../.github/qa/README.md) | Run ID, quan sát an toàn, báo cáo TAP/JUnit/JSON và CSV/Excel |
| [Bộ tạo dữ liệu](../automation-testing/fixtures/qa-data.js) | Bệnh nhân/bác sĩ/dịch vụ/ca trực giả, theo dõi ID sở hữu và cleanup |

Fixture yêu cầu API/MongoDB loopback và database kết thúc bằng `_test`. Tiền điều kiện có thể được tạo trực tiếp; hành động nghiệp vụ cần kiểm tra đi qua HTTP. Thông tin đăng nhập và token không được đưa vào environment đã commit hoặc phần response công bố.

## 5. Hướng dẫn chạy

Hoàn thành [cài đặt dự án](../README.md#5-hướng-dẫn-chạy-kiểm-thử), mở API rồi chạy từ thư mục gốc:

```sh
# Bộ API và hồi quy lỗi; không cần mở UI
node --env-file=.env.test .github/qa/scripts/run-qa.js --suite=api

# Collection Postman với dữ liệu thử riêng
npm ci --prefix api-testing/postman
node --env-file=.env.test .github/qa/scripts/run-postman.js
```

Newman nhận thông tin đăng nhập/ID fixture trong bộ nhớ và dọn dữ liệu thuộc quyền sở hữu sau khi chạy. Nếu khám phá thủ công bằng Postman, import collection/environment, chuẩn bị tài khoản QA cục bộ, ID và ca trực/giờ hẹn hợp lệ. Không commit environment đã xuất có thông tin đăng nhập.

Mỗi lần chạy tạo thư mục riêng trong `automation-testing/reports/generated/runs/`. Assertion Fail, lỗi request/script hoặc lỗi tiến trình đều làm runner trả mã khác 0. Test hồi quy lỗi tiếp tục hoạt động sau khi sửa.

## 6. Kết quả kiểm thử

[Danh mục đầy đủ 46 API test](reports/api-test-catalog.csv) và [bảng giải thích bug/test case](../manual-testing/bug-reports/bug-testcase-map.md) chỉ rõ nhóm, mã nguồn, assertions tham chiếu và bằng chứng. 46 test runtime gắn với 33 mã thiết kế; bảy test trong known-defects là suite riêng.

| Bằng chứng | Kết quả đã ghi nhận |
| --- | --- |
| [TAP API](../automation-testing/reports/runs/QA-20261113T153459634Z-3e9268/api/results.tap) / [JUnit](../automation-testing/reports/runs/QA-20261113T153459634Z-3e9268/api/junit.xml) | 35 Pass / 11 Fail; 46 test |
| [TAP hồi quy lỗi](../automation-testing/reports/runs/QA-20261113T153459634Z-3e9268/known-defects/results.tap) / [JUnit](../automation-testing/reports/runs/QA-20261113T153459634Z-3e9268/known-defects/junit.xml) | 7 Pass |
| [JSON thực thi](../automation-testing/reports/runs/QA-20261113T153459634Z-3e9268/execution.json) | Build, expected/actual, trạng thái và bằng chứng từng test; kết quả UI được phân loại riêng |
| [JSON Newman](reports/newman/QA-20261113T153601759Z-bf5a0c/newman-results.json) | 21 request; 46/46 assertions Pass; không có lỗi |
| [CI đã xác minh bộ mở rộng](https://github.com/htrsng/KiemThu_PhongKham/actions/runs/43455436873) | API 35 Pass / 11 Fail; hồi quy BUG-002/003 7 Pass; UI 12 Pass; unit 19 Pass; Newman 46 assertions Pass. Job Failed do BUG-005/006 |

Xem [chỉ mục báo cáo](reports/README.md). Số liệu thuộc từng run riêng; không cộng dồn run lịch sử/run mới hoặc coi assertions Newman là các case manual độc lập bổ sung.

## 7. Lỗi và giới hạn đã biết

[Registry](../manual-testing/bug-reports/registry.json) có **hai lỗi Open**: [BUG-005](../manual-testing/bug-reports/BUG-005.md), High/P0 — bác sĩ đọc/cập nhật lịch bác sĩ khác; [BUG-006](../manual-testing/bug-reports/BUG-006.md), Medium/P2 — dữ liệu thiếu/ID sai trả 500. Chưa có bản sửa/retest Pass cho hai lỗi này. BUG-002/003 vẫn Closed theo retest đã ghi; bằng chứng trước sửa giữ nguyên.

Coverage mới xác minh các trường hợp cụ thể trên, không chứng minh toàn bộ endpoint/phân quyền đều được kiểm tra. Biên đúng 30 phút mới có bằng chứng controller, chưa phải HTTP/UI/manual. Thanh toán kết hợp và toàn bộ chính sách hóa đơn chính thức chưa được xác nhận là đã triển khai/Pass trên build mới. Xem [giới hạn API](api-contract.md), [đối chiếu nguồn](../docs/requirements/source-reconciliation.md) và [tổng hợp mới nhất](../manual-testing/test-execution/latest-qa-summary.md).
