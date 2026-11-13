# Kế hoạch kiểm thử theo rủi ro — Giai đoạn 1

## 1. Mục tiêu và phạm vi

Mục tiêu của giai đoạn này là xác định các quy tắc nghiệp vụ có thể kiểm chứng, ưu tiên kiểm thử theo rủi ro và chốt phạm vi thực hiện.

Ứng dụng trong `client/` và `server/` là đối tượng được kiểm thử. Phần QA do mình thực hiện nằm ở [`testing/`](../../testing/) và [`docs/qa/`](./).

### Phạm vi chính

| Thứ tự | Module | Phạm vi kiểm thử |
|---|---|---|
| 1 | Đăng nhập và phiên | Đã có bộ kiểm thử API và UI; tiếp tục dùng làm smoke gate |
| 2 | Phân quyền | Quyền theo vai trò, chặn API, menu và các thao tác quản trị |
| 3 | Lịch hẹn/check-in | Tạo lịch, điều kiện lịch trực, sức chứa, chống trùng, chuyển trạng thái và check-in |
| 4 | Thanh toán/hóa đơn | Tạo hóa đơn, thanh toán, số tiền thiếu, ghi nợ, hoàn tiền, phương thức thanh toán và quyền thao tác |

Kho vật tư chỉ được đưa vào sau khi hoàn thành bốn module trên và còn thời gian.

## 2. Yêu cầu và quy tắc nghiệp vụ

### 2.1 Đăng nhập và phiên — `AUTH`

Nguồn chính: [`authController.js`](../../server/src/controllers/authController.js), [`auth.js`](../../server/src/middlewares/auth.js), [`AuthContext.tsx`](../../client/src/contexts/AuthContext.tsx).

- Email và mật khẩu là bắt buộc.
- Email đăng nhập phải có đuôi `@gmail.com`.
- Sai mật khẩu trả HTTP 401 với mã `wrong_password`.
- Tài khoản không tồn tại trả lỗi riêng.
- Tài khoản không ở trạng thái `active` không được đăng nhập.
- Đăng nhập thành công trả JWT và thông tin account nhưng không trả trường mật khẩu.
- JWT có thời hạn 30 ngày.
- Không có token hoặc token sai không được truy cập API bảo vệ.
- `/auth/me` trả đúng tài khoản của token hợp lệ.
- Có thể có ba vai trò: `Admin`, `Doctor`, `Reception`.

Trạng thái hiện tại: **đã xác minh 8 ca API và 5 ca UI**, xem [`verification.md`](./verification.md).

### 2.2 Phân quyền — `AUTHZ`

Nguồn chính: [`auth.js`](../../server/src/middlewares/auth.js), [`accountRoutes.js`](../../server/src/routes/accountRoutes.js), [`invoiceRoutes.js`](../../server/src/routes/invoiceRoutes.js), [`navigation.ts`](../../client/src/config/navigation.ts).

- Hệ thống có ba vai trò: `Admin`, `Doctor`, `Reception`.
- API tài khoản chỉ cho `Admin`.
- Xóa hóa đơn chỉ cho `Admin`; đọc/tạo/cập nhật hóa đơn cho `Admin` và `Reception`.
- Menu giao diện được lọc theo `allowedRoles`.
- Người dùng không có vai trò phù hợp phải nhận HTTP 403 khi gọi API bị hạn chế.
- Người dùng không được tự khóa tài khoản đang đăng nhập.
- Người dùng không được tự xóa tài khoản đang đăng nhập.
- Kiểm thử phải xác minh cả lớp UI và lớp API; ẩn menu không được xem là bằng chứng đủ cho bảo mật.

### 2.3 Lịch hẹn và check-in — `APPT`

Nguồn chính: [`appointmentRoutes.js`](../../server/src/routes/appointmentRoutes.js), [`appointmentController.js`](../../server/src/controllers/appointmentController.js), [`Appointment.js`](../../server/src/models/Appointment.js).

- Lịch hẹn không được đặt trong quá khứ.
- Bác sĩ phải có ca trực bao phủ thời điểm bắt đầu lịch.
- Không được đặt lịch trong thời gian bác sĩ nghỉ phép đã duyệt.
- Ca trực có sức chứa; mặc định là 10 nếu không có cấu hình ca tương ứng.
- Lịch đã hủy không tính vào sức chứa.
- Một bệnh nhân không được đặt nhiều lịch với cùng bác sĩ trong cùng ngày nếu lịch cũ chưa hủy.
- Có đúng năm trạng thái nghiệp vụ:
  - `Đã lên lịch`
  - `Đã đến`
  - `Đang điều trị`
  - `Đã hoàn thành`
  - `Đã hủy`
- Trạng thái chỉ được tiến về phía trước; không được lùi trạng thái.
- Chỉ lịch ở trạng thái `Đã lên lịch` mới được hủy.
- Check-in chỉ áp dụng cho lịch `Đã lên lịch`.
- Check-in chỉ được thực hiện trong khoảng **30 phút trước đến 30 phút sau** giờ hẹn.
- Check-in chuyển lịch sang `Đã đến` và ghi `checkInTime`.
- Walk-in tạo bệnh nhân nếu chưa tồn tại và tạo lịch ở trạng thái `Đã đến`.

### 2.4 Thanh toán và hóa đơn — `PAY`

Nguồn chính: [`invoiceRoutes.js`](../../server/src/routes/invoiceRoutes.js), [`Invoice.js`](../../server/src/models/Invoice.js), [`PaymentManagementPage.tsx`](../../client/src/pages/PaymentManagementPage.tsx).

- Hóa đơn phải gắn với lịch hẹn và bệnh nhân.
- Hóa đơn có tổng tiền, thành tiền, số tiền đã nhận, công nợ và chiết khấu.
- Số tiền nhận không được âm.
- Nếu số tiền nhận nhỏ hơn thành tiền, hệ thống phải từ chối trừ khi người dùng xác nhận ghi nợ.
- Khi cho phép ghi nợ, công nợ bằng `finalAmount - amountPaid`.
- Có các trạng thái: `Chưa thanh toán`, `Đã thanh toán`, `Hoàn tiền`.
- Hoàn tiền cho hóa đơn đã thanh toán chỉ được thực hiện trong 7 ngày kể từ lần cập nhật thanh toán.
- Theo model hiện tại có **4** phương thức thanh toán:
  - `Tiền mặt`
  - `Chuyển khoản`
  - `Thẻ tín dụng`
  - `Thẻ ATM`
- `Admin` và `Reception` được đọc/tạo/cập nhật hóa đơn.
- Chỉ `Admin` được xóa hóa đơn.
- Giao diện hỗ trợ chiết khấu theo tiền hoặc phần trăm, phụ phí, in và xuất CSV.

> Lưu ý yêu cầu: nếu đặc tả nghiệp vụ bên ngoài nói có 3 phương thức thanh toán, cần xác nhận phương thức thứ tư trước khi chốt test case. Kế hoạch này tạm thời bám theo 4 giá trị đang có trong model.

## 3. Đánh giá rủi ro

Thang điểm:

- Khả năng xảy ra: `1` thấp, `2` trung bình, `3` cao.
- Mức ảnh hưởng: `1` thấp, `2` trung bình, `3` cao.
- Điểm rủi ro = Khả năng × Ảnh hưởng.
- `7–9`: Cao; `4–6`: Trung bình; `1–3`: Thấp.

| Module | Rủi ro chính | Khả năng | Ảnh hưởng | Điểm | Mức | Ưu tiên |
|---|---|---:|---:|---:|---|---|
| Đăng nhập/phiên | Người dùng hợp lệ không đăng nhập được hoặc token bị xử lý sai | 2 | 3 | 6 | Trung bình | P1 |
| Phân quyền | Người dùng gọi được API hoặc thao tác vượt quyền | 2 | 3 | 6 | Trung bình | P0 |
| Lịch hẹn/check-in | Đặt trùng, vượt sức chứa hoặc check-in sai khung giờ | 3 | 3 | 9 | Cao | P0 |
| Thanh toán/hóa đơn | Sai số tiền, công nợ, hoàn tiền hoặc quyền thanh toán | 3 | 3 | 9 | Cao | P0 |
| Kho vật tư | Trừ kho sai hoặc tồn kho âm | 2 | 2 | 4 | Trung bình | P2 |
| Tính lương | Sai tổng lương do hệ số, ca hoặc hoa hồng | 2 | 3 | 6 | Trung bình | P1 |
| Dashboard/doanh thu | Số liệu tổng quan không khớp dữ liệu nghiệp vụ | 2 | 2 | 4 | Trung bình | P2 |
| Nhắc lịch | Không gửi được nhắc hẹn hoặc gửi sai đối tượng | 2 | 2 | 4 | Trung bình | P2 |

Ưu tiên cao nhất dành cho phân quyền, lịch hẹn/check-in và thanh toán vì các lỗi này có thể gây truy cập trái phép, mất doanh thu hoặc làm sai vận hành phòng khám.

## 4. Ngoài phạm vi giai đoạn này

| Nội dung | Lý do loại khỏi phạm vi |
|---|---|
| Tính lương và xuất báo cáo lương | Công thức nhiều biến số, cần bộ dữ liệu chuẩn và oracle riêng; chỉ thực hiện sau bốn module ưu tiên |
| Dashboard và thống kê doanh thu | Phụ thuộc dữ liệu của lịch hẹn/hóa đơn; chưa phải luồng giao dịch cốt lõi trong giai đoạn này |
| Nhắc lịch SMS/Zalo | Hiện chỉ là mô phỏng bằng log, chưa có nhà cung cấp tích hợp để kiểm thử đầu-cuối |
| Kho vật tư | Được giữ làm phạm vi dự phòng, chỉ làm nếu còn thời gian |
| Hiệu năng, tải, bảo mật tổng thể và kiểm thử xâm nhập | Cần môi trường, tiêu chí đo và công cụ riêng |
| Tương thích trình duyệt/thiết bị toàn diện | Chưa có ma trận thiết bị và browser được chốt |
| Các kịch bản Cypress legacy trước đây | Đã loại bỏ vì chưa được xác minh và không thuộc bộ kiểm thử hiện tại |

## 5. Chiến lược thực hiện

1. Giữ bộ đăng nhập hiện tại làm smoke gate cho mọi lần chạy.
2. Viết test case theo mã `TC-AUTHZ-*`, `TC-APPT-*` và `TC-PAY-*`.
3. Với mỗi module, kiểm thử tối thiểu:
   - happy path;
   - dữ liệu thiếu/sai;
   - boundary;
   - phân quyền;
   - lỗi API và trạng thái dữ liệu sau thao tác.
4. Mỗi lỗi phát hiện dùng mã `BUG-<số>`, ghi severity và priority theo [`conventions.md`](./conventions.md).
5. Không đánh dấu Pass chỉ vì trang mở được; phải kiểm tra kết quả quan sát được và dữ liệu/API liên quan.

## 6. Môi trường và công cụ

| Thành phần | Giá trị |
|---|---|
| Runtime | Node.js 24, npm |
| Frontend | Vite dev server, mặc định `http://localhost:5173` |
| Backend | Express API, mặc định `http://localhost:5000` |
| Database | MongoDB riêng cho QA, database tên kết thúc bằng `_test` |
| API test | Node.js built-in test runner và `fetch` |
| UI/E2E | Cypress |
| Quản lý dữ liệu | Script QA trong `testing/scripts/`, không dùng seed cũ trên DB thật |
| Bằng chứng | Cypress report, screenshot/video khi lỗi, log API và kết quả test |

Test data phải được sinh hoặc tạo trong DB QA. Credential lấy từ biến môi trường; không ghi credential thật vào test case, fixture hoặc report.

## 7. Tiêu chí vào/ra

### Tiêu chí vào

- Build frontend thành công.
- Backend kết nối được MongoDB QA riêng.
- Tài khoản kiểm thử cho đủ ba vai trò `Admin`, `Doctor`, `Reception`.
- Có dữ liệu tối thiểu cho bác sĩ, bệnh nhân, dịch vụ, ca trực, lịch hẹn và hóa đơn.
- Các endpoint và selector cần thiết đã xác định.
- Test environment không dùng dữ liệu production.

### Tiêu chí ra

- Tất cả test case P0/P1 đã được thực thi hoặc có trạng thái Blocked kèm lý do.
- Không còn lỗi Critical/High chưa được đánh giá hoặc chấp nhận rủi ro.
- RTM có liên kết cho mọi yêu cầu trong phạm vi.
- Có kết quả Pass/Fail/Blocked và bằng chứng cho các case Fail.
- Smoke suite đăng nhập vẫn đạt.
- Báo cáo ghi rõ commit, môi trường, lệnh chạy và phạm vi.

## 8. Phân công

| Vai trò | Trách nhiệm |
|---|---|
| QA owner | Thiết kế test, chuẩn bị data, thực thi, ghi nhận bug và duy trì RTM |
| Developer/maintainer | Hỗ trợ môi trường, giải thích nghiệp vụ, phân tích và sửa lỗi |
| Reviewer | Kiểm tra tính đầy đủ của test case, kỹ thuật và bằng chứng |

Một người có thể kiêm nhiều vai trò trong dự án học tập, nhưng người viết test không tự đánh dấu lỗi đã sửa là Pass nếu chưa có lần chạy xác nhận.

## 9. Kỹ thuật thiết kế được áp dụng

| Kỹ thuật | Áp dụng | Test case |
|---|---|---|
| Equivalence Partitioning (EP) | Email hợp lệ/không hợp lệ, mật khẩu hợp lệ/không hợp lệ, giảm giá, phụ phí | `TC-AUTH-003`–`TC-AUTH-005`, `TC-PAY-005`–`TC-PAY-008` |
| Boundary Value Analysis (BVA) | Check-in 29/30/31 phút, giảm giá 0/100%, phụ phí 0 và âm, mật khẩu biên | `TC-AUTH-006`–`TC-AUTH-007`, `TC-APPT-011`–`TC-APPT-013`, `TC-PAY-009`–`TC-PAY-012` |
| State transition | Năm trạng thái lịch hẹn, chuyển tiến hợp lệ và chuyển lùi/hủy sai | `TC-APPT-014`–`TC-APPT-020` |
| Decision table | Tổ hợp giảm giá × phụ phí × phương thức thanh toán và điều kiện ghi nợ | `TC-PAY-013`–`TC-PAY-016` |
| RBAC matrix | Ba vai trò với chức năng chính và endpoint bị hạn chế | `TC-AUTHZ-001`–`TC-AUTHZ-012` |
| Error guessing | Cập nhật hoàn thành nhiều lần, token sai/hết hạn, dữ liệu thiếu và thao tác lặp | `TC-AUTH-008`–`TC-AUTH-010`, `TC-APPT-021`–`TC-APPT-024`, `TC-PAY-017`–`TC-PAY-018` |

Danh sách case đầy đủ nằm ở [`test-cases.tsv`](../../testing/manual/test-cases.tsv), có thể mở trực tiếp bằng Excel hoặc import vào Google Sheets. Ma trận truy xuất nằm ở [`rtm.tsv`](./rtm.tsv).
