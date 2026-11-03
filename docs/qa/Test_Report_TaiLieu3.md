# TÀI LIỆU 3: BÁO CÁO KIỂM THỬ (TEST REPORT)
**Dự án:** Hệ thống Smart Dental
**Nhóm chức năng:** 4 - Tính lương bác sĩ
**Môi trường test:** Staging / QA
**Người thực hiện:** QA/Automation Team

---

## 1. BÁO CÁO KIỂM THỬ TỰ ĐỘNG (AUTOMATION TEST - CYPRESS)

### 1.1. Phạm vi thực hiện
Đã tự động hóa **25 Test Cases** quan trọng nhất (Critical Paths), bao gồm:
- Kiểm tra Validation form nhập liệu (âm, rỗng, sai định dạng).
- Kiểm tra thiết lập tiền cơ bản, hệ số ca làm việc.
- Kiểm tra luồng tính lương 1 ca hoàn chỉnh với các công thức hệ số kết hợp.

### 1.2. Kết quả thực thi
*Bộ test được chạy qua Cypress Framework tích hợp Mochawesome Reporter.*
- **Tổng số TCs:** 25
- **Pass:** 24 (Tỷ lệ 96%)
- **Fail:** 1 (Tỷ lệ 4%)
- **Thời gian chạy:** ~15 giây

**Chi tiết lỗi (Fail):** 
- *TC_050: Kiểm tra lỗi hệ thống khi tính lương ca cực lớn.* 
- **Lý do:** Hệ thống không chặn cảnh báo khi tiền lương vượt quá hạn mức quy định (Lỗi Validation logic). Báo cáo đính kèm screenshot và video lỗi.

> **🔗 File Báo cáo Chi Tiết (HTML):**
> [Mở Cypress Dashboard Report](file:///d:/PhongKham_KiemThu/cypress/reports/html/index.html) *(Vui lòng click để xem biểu đồ, video chạy và ảnh chụp màn hình lúc lỗi)*

---

## 2. BÁO CÁO KIỂM THỬ PHI CHỨC NĂNG (NON-FUNCTIONAL TEST)

### 2.1. Kiểm thử hiệu năng (Performance Testing - JMeter/k6)
**Mục tiêu:** Đảm bảo hệ thống vẫn hoạt động mượt mà khi tới kỳ chốt lương cuối tháng, nơi nhiều Admin/HR xuất báo cáo cùng lúc.

| Kịch bản Test | CCU (Concurrent Users) | Thời gian phản hồi (Avg) | Error Rate | Trạng thái | Đánh giá |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Lập phiếu lương 1 Bác sĩ** | 10 | 320 ms | 0% | ✅ **PASS** | Tốc độ rất nhanh, đạt tiêu chuẩn (<1s). |
| **Báo cáo tháng toàn phòng khám** | 50 | 1.8 s | 0% | ✅ **PASS** | Chịu tải tốt ở mức phòng khám vừa. |
| **Báo cáo năm toàn hệ thống** | 100 | 4.2 s | 0.5% | ⚠️ **WARN** | Phản hồi chậm (<5s vẫn chấp nhận được), cần tối ưu lại câu truy vấn SQL (Index database). |
| **Spike Test (Truy cập đột biến)** | 500 | 8.5 s | 2.1% | ❌ **FAIL** | Server bắt đầu có dấu hiệu nghẽn, trả về lỗi 502/504 Gateway Timeout. |

**👉 Kết luận Hiệu năng:** Hệ thống đáp ứng rất tốt lượng người dùng theo quy mô của phòng khám. Nếu mở rộng thành chuỗi hệ thống, cần thiết lập Cache Server (Redis) cho các báo cáo cuối năm để giảm tải Database.

---

### 2.2. Kiểm thử bảo mật (Security Testing - OWASP ZAP)
**Mục tiêu:** Rà quét và phát hiện các lỗ hổng Web Application trong luồng xem và sửa lương.

| Lỗ hổng / Rủi ro | Phương thức Test | Trạng thái | Mức độ | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| **SQL Injection** | Payload qua ô tìm kiếm tên BS | ✅ **PASS** | Low | Đã dùng ORM, không bị lỗi SQLi. |
| **Cross-Site Scripting (XSS)** | Chèn `<script>` vào ô Ghi chú | ✅ **PASS** | Low | Front-end React đã escape HTML tự động. |
| **IDOR (Insecure Direct Object Reference)** | Thay đổi ID URL: `/salary/view?id=BS002` bằng tài khoản của BS001 | ❌ **FAIL** | **CRITICAL** | **Nguy hiểm:** Bác sĩ A xem trộm được toàn bộ phiếu lương của Bác sĩ B. Back-end chưa check quyền sở hữu Data. |
| **Session Management** | Thử gọi API sau khi token hết hạn | ✅ **PASS** | Medium | Server bắt lỗi và trả về 401 Unauthorized hợp lệ. |

**👉 Kết luận Bảo mật:** Phát hiện 1 lỗ hổng cực kỳ nghiêm trọng (IDOR) làm ảnh hưởng tới tính bảo mật thông tin thu nhập. Yêu cầu Backend Developer khắc phục và Test lại lập tức.

---

## 3. TỔNG KẾT & NGHIỆM THU (TEST SUMMARY)

- **Quyết định (Go/No-Go):** 🛑 **NO-GO (Chưa đủ điều kiện Golive)**
- **Khuyến nghị từ Team QA:** 
  1. **Bắt buộc:** Fix triệt để lỗ hổng bảo mật **IDOR** để ngăn chặn rò rỉ dữ liệu lương.
  2. Fix lỗi thiếu Validation giới hạn tiền lương (Bug phát hiện từ Cypress Automation).
  3. Thêm DB Indexing cho API báo cáo năm để tối ưu thời gian chờ (<2s).
- **Hành động tiếp theo (Next Step):** Gửi báo cáo Bug cho đội ngũ Development. Chờ bản patch mới và tiến hành Kiểm thử lại hồi quy (Regression Test).
