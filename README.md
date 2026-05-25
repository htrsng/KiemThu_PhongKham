# 🦷 Hệ thống Quản lý Phòng khám Nha khoa (Dental Clinic Management System)

Chào mừng bạn đến với kho lưu trữ mã nguồn và tài liệu Đảm bảo Chất lượng (QA) của Hệ thống Quản lý Phòng khám Nha khoa. Dự án này bao gồm toàn bộ mã nguồn ứng dụng web và một bộ khung kiểm thử (Testing Framework) cực kỳ chuyên nghiệp và toàn diện.

---

## 📁 Cấu trúc Thư mục Dự án

Dự án được tổ chức gọn gàng thành các thành phần độc lập:

```text
📦 d:\PhongKham_KiemThu
 ┣ 📂 dental-system/    # Mã nguồn Frontend (Giao diện người dùng)
 ┣ 📂 server/           # Mã nguồn Backend API (Xử lý nghiệp vụ & Database)
 ┣ 📂 QA_Docs/          # Toàn bộ tài liệu và công cụ Đảm bảo Chất lượng (QA)
 │  ┣ 📂 Generators/    # Chứa các Script Python dùng để sinh dữ liệu và kịch bản Test
 │  ┗ 📂 Test_Cases/    # Chứa kết quả kiểm thử Manual dưới dạng bảng CSV
 ┣ 📂 cypress/          # Khung kiểm thử tự động (Automation E2E Testing)
 ┣ 📂 patches/          # Chứa các script vá lỗi (patch) tạm thời cho hệ thống
 ┣ 📜 cypress.config.js # Cấu hình cho bộ Automation Test Cypress
 ┣ 📜 package.json      # Danh sách thư viện và cấu hình Node.js toàn cục
 ┗ 📜 README.md         # File bạn đang đọc :)
```

---

## 🛠️ Hướng dẫn Khởi chạy Ứng dụng Web

*(Lưu ý: Bạn cần cài đặt [Node.js](https://nodejs.org/) trước khi chạy)*

1. **Khởi chạy Backend (Server)**
   ```bash
   cd server
   npm install
   npm start
   ```

2. **Khởi chạy Frontend (Giao diện)**
   ```bash
   cd dental-system
   npm install
   npm run dev
   ```

---

## 🧪 Hệ thống Đảm bảo Chất lượng (QA & Testing)

Dự án sở hữu một hệ thống kiểm thử khổng lồ với gần **900 Kịch bản kiểm thử (Test Cases)**, bao phủ toàn bộ 3 nhóm nghiệp vụ cốt lõi của một phòng khám nha khoa:
- **Nhóm 1**: Quản lý Người dùng, Bác sĩ và Dịch vụ.
- **Nhóm 2**: Quản lý Lịch khám và Xếp ca làm việc.
- **Nhóm 3**: Tiếp đón, Khám bệnh, Thanh toán và Thống kê.

### 1. Kiểm thử Thủ công (Manual Testing)
Toàn bộ Test Case chi tiết và kết quả chạy (Pass/Fail) được xuất ra file CSV siêu nhẹ tại thư mục `QA_Docs/Test_Cases/`. Bạn có thể dễ dàng mở bằng **Microsoft Excel** hoặc import vào Jira.

Nếu bạn muốn tạo lại bộ dữ liệu test với các giá trị ngẫu nhiên mới, hãy chạy các lệnh Python sau:
```bash
python QA_Docs/Generators/generate_testcase_nhom1.py
python QA_Docs/Generators/generate_testcase_nhom2.py
python QA_Docs/Generators/generate_testcase_nhom3.py
```
Để xem Bảng tóm tắt kết quả kiểm thử (Dashboard), chạy lệnh:
```bash
python QA_Docs/Generators/generate_summary.py
```

### 2. Kiểm thử Tự động (Automation E2E Testing)
Dự án được tích hợp sẵn **Cypress** để tự động hóa các luồng nghiệp vụ phức tạp nhất của Nhóm 3 (Điển hình như: tự động click check-in, tự động kê đơn thuốc, tự động tính tiền có áp dụng voucher giảm giá).

**Cách chạy Automation Test:**
1. Mở Terminal tại thư mục gốc của dự án (`d:\PhongKham_KiemThu`).
2. Mở giao diện Cypress UI:
   ```bash
   npx cypress open
   ```
3. Chọn **E2E Testing** trên cửa sổ hiện ra và click vào các file kịch bản (ví dụ: `UC3_1_CheckIn.cy.js`) để xem máy tính tự động thực hiện thao tác trên trình duyệt.

---

