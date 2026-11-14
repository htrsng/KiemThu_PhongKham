# Đối chiếu bug, test case và mã kiểm thử

## Cập nhật sau sửa — 14/11/2026

Trạng thái hiện hành: **6 bug trong registry đều Closed**. BUG-005/006 được sửa tại commit `1bb247a`, [retest](../../automation-testing/reports/runs/QA-20261114T164815189Z-178426/execution.json) đạt **46 API + 7 hồi quy lỗi + 12 Cypress = 65 Pass / 0 Fail**. BUG-005 có ba test Pass, BUG-006 có chín test Pass. Xem chi tiết bản sửa trong [BUG-005](BUG-005.md) và [BUG-006](BUG-006.md).

Khi phỏng vấn, trình bày quá trình phát hiện → sửa → retest: trước sửa 11 test Fail, sau sửa toàn bộ Pass. Phần bên dưới là **hồ sơ giải thích kết quả trước sửa**, nên các từ Open/Fail và ví dụ câu trả lời ở đó phản ánh thời điểm phát hiện, không phải trạng thái hiện hành. Hai catalog CSV cũng giữ nhãn run trước sửa trong từng dòng; nguồn kết quả mới là retest trên.

Phát hiện phụ phí âm trong workbook 40 case chưa được bản sửa này giải quyết; không nói 6 Closed nghĩa là phần mềm không còn lỗi.

---

Tài liệu dùng để đọc hiểu dự án và chuẩn bị phỏng vấn. Số liệu lấy từ [registry](registry.json) và [run mở rộng đã công bố](../../automation-testing/reports/runs/QA-20261113T153459634Z-3e9268/execution.json), không suy ra từ số dòng trong Excel.

## 1. Sáu bug đang được quản lý

| Bug | Test case thiết kế chính | Hiện tượng trước sửa / hiện tại | Severity / Priority | Trạng thái |
| --- | --- | --- | --- | --- |
| [BUG-001](BUG-001.md) | TC-AUTH-005 | API trả 401 nhưng UI chuyển trang/tải lại làm mất thông báo sai mật khẩu | Medium / P1 | Closed; trạng thái nhập từ hồ sơ lịch sử, có hồi quy UI xác nhận |
| [BUG-002](BUG-002.md) | TC-APPT-021 | PATCH đưa lịch đã hoàn thành về Đang điều trị, GET xác nhận trạng thái bị lùi | High / P1 | Closed sau commit sửa và retest |
| [BUG-003](BUG-003.md) | TC-APPT-022 | Hoàn thành cùng lịch nhiều lần tạo hai hóa đơn | High / P0 | Closed sau retest tuần tự và đồng thời |
| [BUG-004](BUG-004.md) | TC-PAY-003; luồng có TC-APPT-014/018 | UI báo thu tiền nhưng amountPaid vẫn 0, trong khi finalAmount 100000 | High / P1 | Closed sau retest dữ liệu đã lưu |
| [BUG-005](BUG-005.md) | TC-AUTHZ-008 | Doctor A đọc danh sách/chi tiết và cập nhật lịch của Doctor B | High / P0 | **Open** |
| [BUG-006](BUG-006.md) | TC-APPT-025, TC-APPT-026 | Dữ liệu thiếu/ID sai trả HTTP 500 thay vì lỗi đầu vào 4xx | Medium / P2 | **Open** |

**70** là số thiết kế tập trung, có chồng lấp với 337 case gốc. **6** là số defect có mã trong registry, có nguồn phát hiện và thời điểm khác nhau. Không trình bày rằng đã thực thi manual đủ 70 case rồi tự tìm ra toàn bộ 6 bug nếu chưa có hồ sơ chứng minh.

BUG-001 có trạng thái Closed lịch sử nhưng thiếu timestamp từng bước trung gian; không tự dựng đầy đủ New/Open/Fixed/Retest cho bug này. BUG-002/003/004 có commit sửa, sự kiện retest và bằng chứng riêng trong registry.

### Hai bug còn lại đang ở trạng thái gì?

- **Open:** lỗi đã tái hiện và ghi nhận; chưa có bản sửa/retest Pass. Đây là trạng thái thực tế của BUG-005 và BUG-006.
- **Deferred:** đã có quyết định hoãn xử lý sang mốc sau. Dự án chưa ghi quyết định này cho hai lỗi trên.
- **Won’t Fix:** đã có quyết định chấp nhận không sửa và lý do. Dự án chưa ghi quyết định này.

Priority P2 của BUG-006 không tự đồng nghĩa Deferred. Không nói "đang sửa" nếu chưa có hoạt động/commit tương ứng. Trong dự án cá nhân, có thể nói lỗi còn Open và chưa được xử lý; không bịa việc đã chuyển cho một nhóm developer.

## 2. Hai lỗi Open để trình bày khi phỏng vấn

### BUG-005 — Phân quyền theo bác sĩ

**Cách phát hiện:** dùng thiết kế TC-AUTHZ-008. Tạo hai bác sĩ A/B cùng dữ liệu riêng và một tài khoản Doctor A có referenceId đúng. A đọc lịch của mình thành công, sau đó thử danh sách, ID và PATCH của B.

**Expected:** A chỉ thấy lịch được phân công; đọc/cập nhật lịch B bị 403 hoặc 404 và không đổi dữ liệu. **Actual:** GET chi tiết B trả 200; PATCH trả 200; Admin GET lại xác nhận trạng thái của B đã đổi sang Đang điều trị. Ba test HTTP Fail.

**Vì sao High:** vượt quyền truy cập và thay đổi dữ liệu khám của bác sĩ khác, ảnh hưởng tính riêng tư và toàn vẹn dữ liệu. **Vì sao P0:** nên xử lý trước khi dùng dữ liệu thật hoặc phát hành. Đây là đánh giá ưu tiên trong dự án, không phải kết luận mọi endpoint đều bị ảnh hưởng.

**Điểm cần giải thích:** token hợp lệ chỉ chứng minh danh tính, chưa chứng minh quyền sở hữu tài nguyên. Ẩn menu hoặc lọc dữ liệu ở frontend không ngăn người dùng gọi API trực tiếp. Test đọc lại bằng Admin giúp chứng minh mutation thực sự đã được lưu.

**Mẫu kể ngắn, dùng đúng những gì bạn đã tự tái hiện:**

> Em kiểm tra quyền theo đối tượng, không chỉ quyền theo vai trò. Em chuẩn bị tài khoản bác sĩ A và lịch của bác sĩ B. Dù A đã đăng nhập hợp lệ, em kỳ vọng API chặn truy cập lịch B. Thực tế API trả 200 và dữ liệu lịch B bị cập nhật khi đọc lại bằng Admin. Em ghi High/P0 vì có thể đọc và sửa dữ liệu ngoài phạm vi phụ trách. Bug hiện Open, chưa có commit sửa và retest Pass.

**Code/bằng chứng:** [coverage-gaps.test.js](../../api-testing/automated-tests/coverage-gaps.test.js), ba test tên bắt đầu BUG-005; [TAP](../../automation-testing/reports/runs/QA-20261113T153459634Z-3e9268/api/results.tap). Xem [protect/authorize](../../server/src/middlewares/auth.js) và [appointment routes](../../server/src/routes/appointmentRoutes.js) để hiểu chỗ chưa giới hạn tài nguyên theo bác sĩ.

### BUG-006 — Đầu vào sai bị trả lỗi nội bộ

**Cách phát hiện:** dùng TC-APPT-025/026, thay đổi từng trường của payload hợp lệ và gọi các route với ObjectId sai định dạng. Không thay nhiều đầu vào cùng lúc để dễ xác định nguyên nhân.

| Biến thể | Số test | Kết quả đã ghi |
| --- | ---: | --- |
| POST thiếu doctorId | 1 | Pass: 4xx, không tạo lịch |
| POST thiếu patientId/startTime/endTime | 3 | Fail: HTTP 500 |
| POST doctorId/startTime sai định dạng | 2 | Fail: HTTP 500 |
| GET/PATCH/PATCH check-in với ID sai | 3 | Fail: HTTP 500 |
| Tổng | **9** | **1 Pass / 8 Fail** |

**Expected:** dữ liệu không hợp lệ trả 4xx phù hợp, không tạo/sửa dữ liệu. Test hiện không bắt mọi lỗi đầu vào phải có đúng một mã 400. **Actual:** tám trường hợp trả 500; kiểm tra sau thao tác không thấy tạo lịch mới hoặc đổi lịch đối chứng.

**Vì sao Medium:** đã quan sát lỗi phân loại/xử lý đầu vào, nhưng chưa thấy mất dữ liệu hoặc vượt quyền trong các test này; luồng hợp lệ vẫn hoạt động. **Vì sao P2:** ưu tiên sau lỗi phân quyền P0. Không tự suy ra có lỗ hổng nghiêm trọng hơn chỉ từ HTTP 500.

**Mẫu kể ngắn, dùng sau khi bạn đã tự chạy lại:**

> Em bắt đầu từ một payload hợp lệ rồi bỏ từng trường hoặc thay ID/ngày sai định dạng. Tám trường hợp trả 500 thay vì lỗi client 4xx. Em còn GET lại để kiểm tra dữ liệu không bị tạo hoặc sửa ngoài ý muốn. Em xếp Medium/P2 theo tác động quan sát được. Bug vẫn Open; riêng thiếu doctorId đã trả 4xx đúng nên em giữ test đó Pass.

**Code/bằng chứng:** [coverage-gaps.test.js](../../api-testing/automated-tests/coverage-gaps.test.js), các test BUG-006; [TAP](../../automation-testing/reports/runs/QA-20261113T153459634Z-3e9268/api/results.tap). Đối chiếu [router](../../server/src/routes/appointmentRoutes.js), [controller](../../server/src/controllers/appointmentController.js) và [error handler](../../server/server.js).

**Câu hỏi "Vì sao 11 test Fail nhưng chỉ có 2 bug Open?"** Ba test Fail cùng phản ánh lỗi ownership BUG-005; tám test Fail thuộc nhóm xử lý đầu vào BUG-006. Số test Fail và số bug là hai đơn vị khác nhau. Có thể tách bug theo endpoint khi triage nếu xác định nguyên nhân/cách sửa độc lập; hiện registry nhóm như trên.

## 3. Hai câu chuyện Closed có bằng chứng trước/sau

- **BUG-003:** expected một hóa đơn, thực tế hai hóa đơn sau hai lần hoàn thành. High vì có nguy cơ sai nghiệp vụ tài chính, P0 vì cần ngăn tạo trùng. Sửa bằng ràng buộc duy nhất appointmentId và upsert idempotent; retest gồm gửi lặp, 12 request đồng thời, giữ nguyên hóa đơn đã thu tiền và POST trùng bị 409. Test yêu cầu một hóa đơn vẫn được giữ nguyên.
- **BUG-004:** UI báo thanh toán thành công nhưng GET trả amountPaid 0. High vì trạng thái thanh toán không khớp số tiền thực thu; P1 vì cần sửa sớm nhưng không tự gán mọi lỗi thanh toán là P0. Sau sửa payload, GET xác nhận amountPaid = finalAmount = 100000, debt = 0. Luồng là **check-in UI → điều trị API → thu tiền UI**, không phải toàn bộ bước qua UI.

Hai câu chuyện này hữu ích khi được hỏi về lifecycle và retest; BUG-005/006 hữu ích khi được hỏi về lỗi chưa xử lý và cách đánh giá tác động.

## 4. Giải thích con số 46 API test

[Danh mục đủ 46 test](../../api-testing/reports/api-test-catalog.csv) ghi tên native runner, case ID, file mã nguồn, kết quả và đường dẫn evidence cho từng test.

| Nhóm | Số test | Case ID tiêu biểu | Assertions chính | Kết quả trong run nguồn |
| --- | ---: | --- | --- | --- |
| Đăng nhập/phiên/token | 10 | TC-AUTH-001/002/003/004/005/008/009/010/012 | Status, lỗi đúng, có/không token, email chuẩn hóa, account không có password | 10 Pass |
| Phân quyền tài khoản/hóa đơn | 9 | TC-AUTHZ-001/002/003/004/005/007; TC-AUTH-010 một phần | Quyền ba vai trò, token thiếu, hóa đơn còn nguyên khi bị từ chối | 9 Pass |
| Lịch hẹn/check-in/hoàn thành | 8 | TC-APPT-001/002/009/011/013/014/015/018 | Tạo hợp lệ; chặn quá khứ/trùng; trạng thái/thời gian đã lưu; một hóa đơn sau hoàn thành | 8 Pass |
| Thanh toán/công nợ | 7 | TC-PAY-003/004/005/006/007/008/010 | Đủ tiền, bốn phương thức, thiếu tiền, ghi nợ, tiền âm; GET kiểm tra amountPaid/debt/status | 7 Pass |
| Ownership bác sĩ | 3 | TC-AUTHZ-008 | Danh sách, chi tiết và mutation của lịch bác sĩ khác | 3 Fail — BUG-005 |
| Dữ liệu thiếu/ID sai | 9 | TC-APPT-025/026 | 4xx phù hợp và không tạo/sửa dữ liệu | 1 Pass / 8 Fail — BUG-006 |
| **Tổng** | **46** | **33 mã case thiết kế khác nhau** | Các biến thể được tính theo test mà runner thực thi | **35 Pass / 11 Fail** |

Các file cần đọc:

1. [auth.test.js](../../api-testing/automated-tests/auth.test.js): 10 test.
2. [authorization-invoice.test.js](../../api-testing/automated-tests/authorization-invoice.test.js): 24 test = 9 phân quyền + 8 lịch hẹn + 7 thanh toán.
3. [coverage-gaps.test.js](../../api-testing/automated-tests/coverage-gaps.test.js): 12 test = 3 ownership + 9 đầu vào.

Ví dụ đếm: TC-AUTH-002 có một test lặp qua ba payload thiếu thông tin, nên runner vẫn đếm một. TC-APPT-025 có sáu test theo từng biến thể; TC-APPT-026 có ba test theo route/method. Không gọi 46 test là 46 case thiết kế độc lập.

### Bảy test hồi quy riêng

[known-defects.test.js](../../api-testing/automated-tests/known-defects.test.js) có **7 test bổ sung, không nằm trong 46**: test gốc BUG-002, test gốc BUG-003, ma trận chuyển trạng thái, PATCH metadata, hoàn thành đồng thời, bảo toàn hóa đơn đã thu tiền/POST trùng và retry hóa đơn thiếu. Trong run nguồn, cả 7 Pass.

Vì vậy bộ HTTP theo runner gồm 46 API + 7 hồi quy lỗi. Cộng thêm 12 Cypress mới thành **65 test nghiệp vụ: 54 Pass / 11 Fail**.

## 5. Giải thích đủ 12 Cypress test

[Danh mục 12 test](../../automation-testing/reports/cypress-test-catalog.csv) giữ tên và kết quả chính xác. Một test có thể gắn nhiều case ID; 12 test hiện liên kết tới 14 mã case thiết kế, không phải 12 case Excel hoàn toàn độc lập.

| STT | Spec | Case ID | Điều cần giải thích |
| ---: | --- | --- | --- |
| 1 | login.cy.js | TC-AUTH-010, UI subset | Chưa có phiên thì route bảo vệ chuyển về login; chưa chứng minh token hết hạn ở mức UI |
| 2 | login.cy.js | TC-AUTH-002 | Trường bắt buộc và vẫn ở trang login; validation trình duyệt |
| 3 | login.cy.js | TC-AUTH-003 | Email không phải Gmail bị báo lỗi UI; không tự suy rằng test UI này đã quan sát HTTP 400 |
| 4 | login.cy.js | TC-AUTH-005 / BUG-001 | API 401, form vẫn có thông báo sai mật khẩu, localStorage không có token |
| 5 | login.cy.js | TC-AUTH-001/012 | Đăng nhập UI, token được lưu; GET /me xác nhận đúng tài khoản |
| 6 | core-workflows.cy.js | TC-AUTHZ-001 | Admin mở trang tài khoản; API trả 200 và dữ liệu mảng |
| 7 | core-workflows.cy.js | TC-AUTHZ-002 | Doctor không thấy menu tài khoản; API bị 403 |
| 8 | core-workflows.cy.js | TC-AUTHZ-003 | Reception không thấy menu tài khoản; API bị 403 |
| 9 | core-workflows.cy.js | TC-APPT-014 | Check-in UI, PATCH 200, dòng lịch Đã đến, GET có checkInTime; không kiểm soát mốc 0 ms tuyệt đối |
| 10 | core-workflows.cy.js | TC-PAY-002 | UI hóa đơn hiển thị bệnh nhân/100.000đ; GET xác nhận chưa thanh toán |
| 11 | core-workflows.cy.js | TC-PAY-017 | Giảm giá vượt tổng tiền bị báo lỗi, không gửi PATCH và dữ liệu hóa đơn giữ nguyên |
| 12 | core-workflows.cy.js | TC-APPT-014/018, TC-PAY-003 / BUG-004 | Luồng hybrid check-in UI → điều trị API → thanh toán UI → GET xác minh số tiền |

Nhóm theo mục đích: **5 login + 3 RBAC + 1 check-in + 1 xem hóa đơn + 1 validation giảm giá + 1 hybrid = 12**. Tất cả 12 Pass trong run nguồn. Hybrid không xác minh đầy đủ ownership bác sĩ; BUG-005 cho thấy không thể dùng một luồng positive Pass để kết luận toàn bộ authorization đúng.

Đọc [login spec](../../automation-testing/cypress/e2e/login.cy.js), [core spec](../../automation-testing/cypress/e2e/core-workflows.cy.js), [commands](../../automation-testing/cypress/support/commands.js), [fixture factory](../../automation-testing/fixtures/qa-data.js) và [config](../../automation-testing/cypress.config.js).

## 6. Không cộng nhầm các bộ kiểm thử

- 70: thiết kế tập trung, chồng lấp với 337 nguồn.
- 46 + 7 + 12 = 65: số test nghiệp vụ trong bộ chuẩn, 54 Pass / 11 Fail.
- 19 unit: 13 reporting/lifecycle + 6 biên controller dùng persistence mock; tách khỏi HTTP/UI.
- 21 request / 46 assertions Newman: một bộ riêng; số 46 assertions không phải số 46 API test Node.
- [40 case hỗ trợ ngày 14/11](../test-execution/assisted-runs/README.md): Excel đánh giá 38 Pass / 1 Fail / 1 Blocked; không phải 40 case đã được bạn thực thi manual.

Trong bộ 40 có phát hiện phụ phí âm ở **TC-PAY-016** đang chờ phân loại/đăng ký bug. Vì vậy "6 bug" là số **đã có mã trong registry**, không phải khẳng định không còn phát hiện nào khác. Chưa tự thêm BUG-007 hoặc coi phát hiện này là đã sửa.

## 7. Trả lời trung thực về AI và kỹ năng cá nhân

Việc dùng AI hỗ trợ viết test không chứng minh bạn tự viết hoặc đã hiểu từng dòng. Không gán toàn bộ phần hỗ trợ cho Copilot nếu không có căn cứ; có thể nói chung là AI/Codex hỗ trợ. Chỉ nói "em tự chạy, sửa và kiểm tra lại" với phần bạn thực sự đã làm.

Trước khi dùng bullet **Developed 46 API tests**, bạn cần tự giải thích và thực hiện được:

1. Dữ liệu/tiền điều kiện của test được tạo ở đâu; vì sao token hợp lệ khác với quyền theo tài nguyên.
2. Request nào là bước đang kiểm thử, request nào chỉ setup/login/GET xác minh.
3. Mỗi assertion kiểm điều gì; vì sao không chỉ kiểm status code hay thông báo UI.
4. Vì sao test Fail; phân biệt lỗi ứng dụng với thiếu dữ liệu, lỗi selector hoặc timeout chụp ảnh.
5. Fixture được cleanup theo ID sở hữu thế nào; vì sao không drop DB hoặc ghi mật khẩu/token vào evidence.
6. Đọc TAP/JUnit/JSON, chỉ đúng case/bug và build, tự chạy lại một test rồi giải thích kết quả.

Ví dụ mô tả trung tính trong CV, không nhận tự viết toàn bộ:

> QA portfolio covering 46 API checks and 12 Cypress scenarios, with AI-assisted implementation, execution evidence and traceable defect reports.

Mẫu trả lời phỏng vấn **sau khi bạn đã tự chạy và đọc hiểu phần trình bày**:

> Em dùng AI hỗ trợ tạo và hoàn thiện một phần mã kiểm thử. Em không nhận toàn bộ code là tự viết từ đầu. Với các test em trình bày, em có thể giải thích tiền điều kiện, request, assertions và cách đọc lại dữ liệu; em cũng chỉ ra được test nào là API, UI hoặc hybrid và bằng chứng của lần chạy tương ứng.

## 8. Thực hành trước phỏng vấn

Từ thư mục gốc, khi backend QA đang chạy và .env.test đã có:

```sh
# Chạy riêng ba test ownership; hiện kỳ vọng nghiệp vụ vẫn Fail do BUG-005 Open
node --env-file=.env.test --test --test-name-pattern=BUG-005 api-testing/automated-tests/coverage-gaps.test.js

# Chạy lại kiểm tra hoàn thành lặp/đồng thời của BUG-003
node --env-file=.env.test --test --test-name-pattern=BUG-003 api-testing/automated-tests/known-defects.test.js

# Toàn bộ API và bảy test hồi quy; có báo cáo theo Run ID
node --env-file=.env.test .github/qa/scripts/run-qa.js --suite=api
```

Hãy tự kể được BUG-005 và một bug Closed như BUG-003/004, rồi mở đúng test/evidence để giải thích. Không chỉ học thuộc con số. [Tổng hợp QA mới nhất](../test-execution/latest-qa-summary.md) ghi trạng thái của bộ chuẩn; các catalog đi kèm tài liệu này là ảnh chụp số liệu của run nguồn đã nêu, không được tự nhận là một lần test mới.
