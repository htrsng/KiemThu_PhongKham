# API checklist và nguồn đối chiếu

Base URL QA: `http://localhost:5000/api`. Các status dưới đây lấy từ routes/controller đang chạy và assertion đã thực thi; đây là hợp đồng phục vụ QA học tập, chưa phải đặc tả nghiệp vụ được stakeholder phê duyệt. Không mặc định mọi validation error của ứng dụng trả 400.

| Method / endpoint | Request / quyền | Kỳ vọng chính | Kiểm thử hiện tại |
| --- | --- | --- | --- |
| POST `/auth/login` | email, password; public | 200 token/account không password; 400 thiếu trường/email sai; 401 wrong_password; 403 locked; 404 not_found | Regression đã chạy trừ nhánh 404 |
| GET `/auth/me` | Bearer token | 200 account của token, không password; 401 missing/invalid/expired | Đã chạy cả missing, invalid và JWT ký hợp lệ nhưng hết hạn |
| GET `/accounts` | Admin | 200 data array; Doctor/Reception 403 | API và UI đã chạy |
| POST `/appointments` | Token, patient/doctor/service và thời gian | 201 đúng ca; 400 quá khứ/trùng bệnh nhân-bác sĩ trong ngày | Đã chạy và GET kiểm tra side effect |
| PATCH `/appointments/:id/checkin` | Token, lịch đã lên lịch | 200 và checkInTime; ngoài ±30 phút hoặc sai trạng thái 400 | Đã chạy offset +29, -31, 0 và sai trạng thái; biên đúng 30 chưa chạy |
| PATCH `/appointments/:id` | Token, status | Chỉ tiến trạng thái; hoàn thành tạo một invoice | Lần đầu Pass; lùi/lặp Fail, BUG-002/003 |
| GET `/invoices?appointmentId=:id` | Admin/Reception | 200 array có invoice của lịch; Doctor 403 | Đã chạy Admin/Reception, Doctor GET/PATCH 403 và missing token 401 |
| PATCH `/invoices/:id` | Admin/Reception; amountPaid, finalAmount, status, allowDebt | 200 khi đủ tiền/ghi nợ; 400 thiếu tiền không ghi nợ hoặc số âm | Đã chạy và GET kiểm tra amountPaid/debt/status |
| DELETE `/invoices/:id` | Admin | 200; GET sau xóa 404; Doctor/Reception 403, invoice còn nguyên | Đã chạy cả ba role, appointment không bị xóa |

## Ví dụ thanh toán và oracle

```json
{"amountPaid":40000,"finalAmount":100000,"allowDebt":true,"status":"Đã thanh toán","paymentMethod":"Tiền mặt"}
```

Kỳ vọng HTTP 200; đọc lại có `amountPaid = 40000`, `debt = 60000` và trạng thái `Đã thanh toán`. Cùng dữ liệu nhưng `allowDebt = false` phải HTTP 400, trạng thái và số dư trước thao tác giữ nguyên. Token lấy từ môi trường QA; không dán giá trị vào tài liệu.

## Giới hạn và rủi ro cần điều tra

Hệ thống có cả PUT, PATCH và route `/:id/finish`; thứ tự mount trong `server/server.js` ảnh hưởng handler thực sự chạy. Không dùng nội dung router đơn lẻ làm bằng chứng runtime. Các endpoint appointment hiện kiểm tra đăng nhập, chưa có ma trận ownership theo từng bác sĩ được xác minh. Validation thiếu trường/ID sai có thể đi qua global error handler trả 500; chưa ghi nhận chúng là bug đã tái hiện trong báo cáo này.

Nguồn: `server/server.js`, `server/src/controllers/authController.js`, `server/src/controllers/appointmentController.js`, `server/src/routes/accountRoutes.js`, `server/src/routes/appointmentRoutes.js`, `server/src/routes/invoiceRoutes.js`, `server/src/middlewares/auth.js` và các model tương ứng. Postman phục vụ khám phá thủ công; báo cáo tự động lấy từ Node runner.
