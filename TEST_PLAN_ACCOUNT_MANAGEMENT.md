# Kế hoạch kiểm thử - Quản lý tài khoản (Nhóm chức năng 1)

**Hệ thống**: SmileCare Dental Clinic  
**Module**: Quản lý tài khoản (Account Management)  
**Phiên bản**: v1.0  
**Ngày soạn**: 29/04/2026  
**Trạng thái**: Sẵn sàng kiểm thử

---

## 1. Mục tiêu kiểm thử

- Đảm bảo chức năng CRUD (Tạo, Đọc, Cập nhật, Xóa) tài khoản hoạt động chính xác
- Kiểm tra tính hợp lệ của dữ liệu nhập liệu (validation) đầy đủ
- Xác minh các tác vụ quản lý trạng thái (khóa/mở khóa) hoạt động đúng
- Kiểm thử lọc, tìm kiếm và phân trang
- Xác nhận ghi log hoạt động được tạo chính xác
- Kiểm tra trải nghiệm người dùng (UI/UX): toast, confirm dialog, loading state

---

## 2. Phạm vi kiểm thử

### Các chức năng được kiểm thử

1. **Danh sách tài khoản**
   - Hiển thị danh sách tài khoản
   - Tìm kiếm theo username, tên, email
   - Lọc theo vai trò (All/Admin/Doctor/Reception)
   - Phân trang (5 bản ghi/trang)
   - Xóa bộ lọc

2. **Thêm tài khoản**
   - Form nhập liệu
   - Validation các trường
   - Tạo tài khoản mới
   - Ghi log hoạt động

3. **Chỉnh sửa tài khoản**
   - Mở modal edit
   - Validation các trường (password tùy chọn)
   - Cập nhật tài khoản
   - Ghi log hoạt động

4. **Xóa tài khoản**
   - Confirm dialog xác nhận
   - Xóa khỏi danh sách
   - Ghi log hoạt động
   - Hủy xóa

5. **Khóa/mở khóa tài khoản**
   - Toggle trạng thái
   - Cập nhật badge màu
   - Ghi log hoạt động

6. **Lịch sử hoạt động (Audit Log)**
   - Hiển thị danh sách hoạt động
   - Tìm kiếm theo tên tài khoản
   - Lọc theo loại hành động
   - Phân trang
   - Xóa bộ lọc

---

## 3. Loại kiểm thử

| Loại | Mô tả | Ưu tiên |
|------|-------|--------|
| Kiểm thử chức năng (Functional) | Kiểm tra tính chính xác của các chức năng CRUD | Cao |
| Kiểm thử validation | Kiểm tra tính hợp lệ dữ liệu nhập | Cao |
| Kiểm thử UI/UX | Kiểm tra toast, confirm dialog, loading state | Trung bình |
| Kiểm thử phân trang/lọc | Kiểm tra phân trang, tìm kiếm, lọc | Cao |
| Kiểm thử tích hợp | Kiểm tra ghi log hoạt động kèm với CRUD | Trung bình |
| Kiểm thử edge cases | Dữ liệu biên, rỗng, ký tự đặc biệt | Cao |

---

## 4. Chiến lược kiểm thử

1. **Kiểm thử thủ công (Manual Testing)**
   - Kiểm tra tất cả luồng CRUD
   - Kiểm tra validation form
   - Kiểm tra UI responses

2. **Kiểm thử tự động (Automation Testing)**
   - Unit tests cho validators
   - Integration tests cho modal logic
   - E2E tests cho luồng CRUD hoàn chỉnh

3. **Kiểm thử về hiệu suất**
   - Thời gian load danh sách
   - Thời gian tìm kiếm/lọc
   - Memory usage với 15 records

---

## 5. Tiêu chí Pass/Fail

### Pass
- Tất cả test cases đều pass ✓
- Không có lỗi JavaScript trong console
- Toast/confirm dialog hiển thị đúng
- Dữ liệu được lưu và hiển thị chính xác
- Validation hoạt động cho tất cả trường

### Fail
- Bất kỳ test case nào không pass ✗
- Lỗi trong validation (từ chối dữ liệu hợp lệ hoặc chấp nhận dữ liệu không hợp lệ)
- Dữ liệu không được lưu/cập nhật/xóa
- Toast/confirm không hiển thị
- Log hoạt động không được ghi

---

## 6. Môi trường kiểm thử

- **Frontend**: React 19 + TypeScript, Vite dev server (localhost:5173)
- **Trình duyệt**: Chrome, Firefox, Safari (phiên bản mới nhất)
- **Dữ liệu**: Mock data (15 tài khoản, 20 log hoạt động)
- **Thiết bị**: Desktop (1920x1080), Tablet, Mobile

---

## 7. Lịch trình kiểm thử

| Giai đoạn | Thời lượng | Ghi chú |
|-----------|-----------|--------|
| Kiểm thử chức năng | 2 giờ | Manual testing toàn bộ chức năng |
| Kiểm thử validation | 1 giờ | Boundary testing, invalid data |
| Kiểm thử UI/UX | 1 giờ | Cross-browser, responsive |
| Kiểm thử edge cases | 1 giờ | Trường hợp đặc biệt |
| Ghi chép bug & fix | 1 giờ | Tổng hợp, fix nếu cần |

**Tổng cộng: 6 giờ**

---

# DANH SÁCH TEST CASES

## **Test Suite 1: Danh sách tài khoản (Account List)**

### TC1.1: Hiển thị danh sách tài khoản lúc khởi tạo
```
Mục tiêu: Xác minh danh sách tài khoản được tải và hiển thị đúng
Điều kiện tiên quyết: Truy cập trang Account Management
Các bước:
  1. Tải trang Account Management
  2. Chờ loading state kết thúc (500ms)
  3. Xác nhận danh sách tài khoản hiển thị

Dữ liệu mong đợi:
  - Hiển thị 5 tài khoản (PAGE_SIZE = 5)
  - Cột: Username | Họ tên | Email | Vai trò | Trạng thái | Lần đăng nhập | Hành động
  - Không có lỗi JavaScript trong console

Kết quả mong đợi: PASS
```

### TC1.2: Phân trang tài khoản hoạt động đúng
```
Mục tiêu: Xác minh phân trang 5 bản ghi/trang hoạt động chính xác
Điều kiện tiên quyết: Danh sách tài khoản đã được tải (15 records)
Các bước:
  1. Kiểm tra trang 1: hiển thị bản ghi 1-5
  2. Click nút "Tiếp" → trang 2
  3. Kiểm tra trang 2: hiển thị bản ghi 6-10
  4. Click nút "Tiếp" → trang 3
  5. Kiểm tra trang 3: hiển thị bản ghi 11-15
  6. Click nút "Trước" → trang 2
  7. Kiểm tra nút "Trước" bị disable trên trang 1
  8. Kiểm tra nút "Tiếp" bị disable trên trang 3

Kết quả mong đợi: PASS
```

### TC1.3: Tìm kiếm theo username
```
Mục tiêu: Kiểm tra tìm kiếm theo tên đăng nhập hoạt động đúng
Điều kiện tiên quyết: Danh sách tài khoản đã được tải
Các bước:
  1. Nhập "an.nguyen" vào ô tìm kiếm
  2. Kiểm tra danh sách chỉ hiển thị bản ghi chứa "an.nguyen"
  3. Xóa tìm kiếm → danh sách được khôi phục
  4. Tìm kiếm "nonexistent" → EmptyState hiển thị

Dữ liệu kiểm thử:
  - Tìm kiếm: "an.nguyen", "minh", "nonexistent"

Kết quả mong đợi: PASS
```

### TC1.4: Tìm kiếm theo tên đầy đủ
```
Mục tiêu: Kiểm tra tìm kiếm theo họ tên hoạt động
Điều kiện tiên quyết: Danh sách tài khoản đã được tải
Các bước:
  1. Nhập "Nguyen" vào ô tìm kiếm
  2. Kiểm tra kết quả chứa "Nguyen" (case-insensitive)
  3. Kiểm tra phân trang được reset về trang 1

Kết quả mong đợi: PASS
```

### TC1.5: Tìm kiếm theo email
```
Mục tiêu: Kiểm tra tìm kiếm theo email hoạt động
Điều kiện tiên quyết: Danh sách tài khoản đã được tải
Các bước:
  1. Nhập "smilecare.vn" vào ô tìm kiếm
  2. Kiểm tra kết quả chứa "smilecare.vn"

Kết quả mong đợi: PASS
```

### TC1.6: Lọc theo vai trò (Role Filter)
```
Mục tiêu: Kiểm tra lọc theo vai trò hoạt động chính xác
Điều kiện tiên quyết: Danh sách tài khoản đã được tải
Các bước:
  1. Chọn "Admin" → hiển thị chỉ tài khoản Admin
  2. Chọn "Doctor" → hiển thị chỉ tài khoản Doctor
  3. Chọn "Reception" → hiển thị chỉ tài khoản Reception
  4. Chọn "All" → hiển thị tất cả tài khoản

Dữ liệu mong đợi:
  - 5 Admin, 5 Doctor, 5 Reception (từ mock data)

Kết quả mong đợi: PASS
```

### TC1.7: Kết hợp tìm kiếm và lọc
```
Mục tiêu: Kiểm tra tìm kiếm kết hợp lọc hoạt động
Điều kiện tiên quyết: Danh sách tài khoản đã được tải
Các bước:
  1. Lọc vai trò "Admin"
  2. Nhập "an" vào ô tìm kiếm
  3. Kiểm tra kết quả chỉ hiển thị Admin có tên/username chứa "an"

Kết quả mong đợi: PASS
```

### TC1.8: Nút "Xóa bộ lọc" hoạt động
```
Mục tiêu: Kiểm tra nút xóa bộ lọc reset tìm kiếm và lọc
Điều kiện tiên quyết: Danh sách tài khoản có tìm kiếm hoặc lọc
Các bước:
  1. Nhập tìm kiếm: "an.nguyen"
  2. Chọn lọc vai trò: "Admin"
  3. Kiểm tra nút "Xóa bộ lọc" hiển thị
  4. Click nút "Xóa bộ lọc"
  5. Kiểm tra tìm kiếm và lọc được xóa, danh sách reset

Kết quả mong đợi: PASS
```

---

## **Test Suite 2: Thêm tài khoản (Create Account)**

### TC2.1: Mở modal thêm tài khoản
```
Mục tiêu: Kiểm tra modal thêm tài khoản hiển thị đúng
Điều kiện tiên quyết: Trang Account Management đã tải
Các bước:
  1. Click nút "Thêm mới"
  2. Kiểm tra modal mở với tiêu đề "Thêm tài khoản"
  3. Kiểm tra form trống, password không hiển thị
  4. Kiểm tra các trường: Username, Họ tên, Email, Vai trò, Mật khẩu, XN MK, Trạng thái

Kết quả mong đợi: PASS
```

### TC2.2: Validate trường Username (bắt buộc)
```
Mục tiêu: Kiểm tra validation username bắt buộc
Điều kiện tiên quyết: Modal thêm tài khoản đã mở
Các bước:
  1. Để trống Username
  2. Nhập dữ liệu các trường khác
  3. Click nút "Lưu"
  4. Kiểm tra thông báo lỗi: "Username không được để trống"

Kết quả mong đợi: PASS
```

### TC2.3: Validate định dạng Username (chỉ chữ thường + dấu chấm)
```
Mục tiêu: Kiểm tra format username: chữ thường, dấu chấm, 4+ ký tự
Điều kiện tiên quyết: Modal thêm tài khoản đã mở
Các bước:
  1. Nhập Username: "ABC.NGUYEN" (chữ hoa) → lỗi
  2. Nhập Username: "an_nguyen" (dấu gạch dưới) → lỗi
  3. Nhập Username: "an" (< 4 ký tự) → lỗi
  4. Nhập Username: "an.nguyen" (đúng format) → không lỗi

Dữ liệu kiểm thử:
  - "ABC.NGUYEN", "an_nguyen", "an", "an.nguyen"

Kết quả mong đợi: PASS
```

### TC2.4: Validate trường Họ tên (bắt buộc)
```
Mục tiêu: Kiểm tra validation họ tên bắt buộc
Điều kiện tiên quyết: Modal thêm tài khoản đã mở
Các bước:
  1. Để trống Họ tên
  2. Nhập dữ liệu các trường khác
  3. Click nút "Lưu"
  4. Kiểm tra thông báo lỗi: "Họ tên không được để trống"

Kết quả mong đợi: PASS
```

### TC2.5: Validate Email (bắt buộc & định dạng)
```
Mục tiêu: Kiểm tra validation email
Điều kiện tiên quyết: Modal thêm tài khoản đã mở
Các bước:
  1. Để trống Email → lỗi "Email không được để trống"
  2. Nhập "notanemail" (không phải email) → lỗi
  3. Nhập "an@smilecare.vn" (đúng) → không lỗi

Dữ liệu kiểm thử:
  - "", "notanemail", "an@", "an@smilecare.vn"

Kết quả mong đợi: PASS
```

### TC2.6: Validate Mật khẩu (bắt buộc, 8+ ký tự, ít nhất 1 chữ hoa, 1 số)
```
Mục tiêu: Kiểm tra validation mật khẩu
Điều kiện tiên quyết: Modal thêm tài khoản đã mở
Các bước:
  1. Để trống Mật khẩu → lỗi
  2. Nhập "pass" (< 8 ký tự) → lỗi
  3. Nhập "password1" (không chữ hoa) → lỗi
  4. Nhập "Password" (không số) → lỗi
  5. Nhập "Password1" (đúng) → không lỗi

Dữ liệu kiểm thử:
  - "", "pass", "password1", "Password", "Password1"

Kết quả mong đợi: PASS
```

### TC2.7: Validate Xác nhận mật khẩu (khớp mật khẩu)
```
Mục tiêu: Kiểm tra xác nhận mật khẩu khớp
Điều kiện tiên quyết: Modal thêm tài khoản đã mở
Các bước:
  1. Nhập Mật khẩu: "Password1"
  2. Nhập Xác nhận: "Password2" (không khớp)
  3. Kiểm tra lỗi: "Mật khẩu không trùng khớp"
  4. Nhập Xác nhận: "Password1" (khớp) → không lỗi

Kết quả mong đợi: PASS
```

### TC2.8: Hiển thị/ẩn mật khẩu
```
Mục tiêu: Kiểm tra toggle hiển thị mật khẩu
Điều kiện tiên quyết: Modal thêm tài khoản đã mở
Các bước:
  1. Nhập Mật khẩu: "Password1"
  2. Kiểm tra input hiển thị dạng *** (type="password")
  3. Click icon eye → input hiển thị plaintext
  4. Click icon eye lại → input ẩn lại

Kết quả mong đợi: PASS
```

### TC2.9: Thêm tài khoản mới thành công
```
Mục tiêu: Kiểm tra tạo tài khoản mới hoàn thành
Điều kiện tiên quyết: Modal thêm tài khoản đã mở
Các bước:
  1. Nhập dữ liệu đúng:
     - Username: "new.doctor"
     - Họ tên: "Trần Văn Mới"
     - Email: "new.doctor@smilecare.vn"
     - Vai trò: "Doctor"
     - Mật khẩu: "Password1"
     - Xác nhận: "Password1"
     - Trạng thái: "Hoạt động"
  2. Click nút "Lưu"
  3. Kiểm tra toast "Tạo tài khoản thành công"
  4. Modal đóng
  5. Danh sách cập nhật, tài khoản mới ở đầu

Dữ liệu input:
  - Username: "new.doctor"
  - Họ tên: "Trần Văn Mới"
  - Email: "new.doctor@smilecare.vn"
  - Vai trò: "Doctor"
  - Mật khẩu: "Password1"
  - Trạng thái: "Hoạt động"

Kết quả mong đợi: PASS
```

### TC2.10: Hủy tạo tài khoản
```
Mục tiêu: Kiểm tra hủy modal không lưu dữ liệu
Điều kiên tiên quyết: Modal thêm tài khoản đã mở với dữ liệu
Các bước:
  1. Nhập dữ liệu vào form
  2. Click nút "X" hoặc "Hủy"
  3. Modal đóng
  4. Danh sách không thay đổi
  5. Toast không hiển thị

Kết quả mong đợi: PASS
```

### TC2.11: Thêm tài khoản với dữ liệu biên (Username dài)
```
Mục tiêu: Kiểm tra xử lý username dài
Điều kiên tiên quyết: Modal thêm tài khoản đã mở
Các bước:
  1. Nhập Username: "very.long.doctor.username.with.many.characters"
  2. Kiểm tra được chấp nhận và hiển thị đúng

Kết quả mong đợi: PASS
```

---

## **Test Suite 3: Chỉnh sửa tài khoản (Edit Account)**

### TC3.1: Mở modal chỉnh sửa
```
Mục tiêu: Kiểm tra modal edit mở đúng với dữ liệu
Điều kiên tiên quyết: Danh sách tài khoản đã tải
Các bước:
  1. Click icon "Sửa" (bút chì) trên tài khoản
  2. Modal mở với tiêu đề "Chỉnh sửa tài khoản"
  3. Form được điền dữ liệu tài khoản hiện tại
  4. Trường mật khẩu trống (tùy chọn)

Kết quả mong đợi: PASS
```

### TC3.2: Chỉnh sửa tài khoản mà không đổi mật khẩu
```
Mục tiêu: Kiểm tra update tài khoản mà password không bắt buộc
Điều kiên tiên quyết: Modal edit đã mở
Các bước:
  1. Sửa Họ tên: "Trần Văn Hùng" → "Trần Văn Kiên"
  2. Sửa Vai trò: "Doctor" → "Admin"
  3. Để trống Mật khẩu và Xác nhận
  4. Click "Lưu"
  5. Kiểm tra toast: "Cập nhật tài khoản thành công"
  6. Danh sách cập nhật dữ liệu mới

Kết quả mong đợi: PASS
```

### TC3.3: Chỉnh sửa tài khoản và đổi mật khẩu
```
Mục tiêu: Kiểm tra update tài khoản kèm đổi mật khẩu
Điều kiên tiên quyết: Modal edit đã mở
Các bước:
  1. Sửa Họ tên
  2. Nhập Mật khẩu mới: "NewPass1"
  3. Xác nhận: "NewPass1"
  4. Click "Lưu"
  5. Kiểm tra cập nhật thành công

Kết quả mong đợi: PASS
```

### TC3.4: Validate mật khẩu mới khi edit
```
Mục tiêu: Kiểm tra validation mật khẩu mới
Điều kiên tiên quyết: Modal edit đã mở
Các bước:
  1. Sửa Họ tên
  2. Nhập Mật khẩu: "pass" (< 8 ký tự)
  3. Click "Lưu"
  4. Kiểm tra lỗi validation

Kết quả mong đợi: PASS
```

### TC3.5: Hủy chỉnh sửa tài khoản
```
Mục tiêu: Kiểm tra hủy edit không lưu
Điều kiên tiên quyết: Modal edit đã mở với dữ liệu thay đổi
Các bước:
  1. Sửa Họ tên
  2. Click nút "Hủy" hoặc "X"
  3. Modal đóng
  4. Danh sách không thay đổi

Kết quả mong đợi: PASS
```

### TC3.6: Chỉnh sửa email thành email trùng lặp (nếu có)
```
Mục tiêu: Kiểm tra xác thực email không trùng (nếu backend yêu cầu)
Điều kiên tiên quyết: Modal edit đã mở
Các bước:
  1. Sửa Email: "existing@smilecare.vn" (đã tồn tại)
  2. Kiểm tra validation

Ghi chú: Chỉ áp dụng nếu backend có check unique email

Kết quả mong đợi: Tùy thuộc yêu cầu
```

---

## **Test Suite 4: Xóa tài khoản (Delete Account)**

### TC4.1: Mở dialog xác nhận xóa
```
Mục tiêu: Kiểm tra dialog xóa hiển thị đúng
Điều kiên tiên quyết: Danh sách tài khoản đã tải
Các bước:
  1. Click icon "Xóa" (thùng rác) trên tài khoản
  2. Dialog xác nhận mở
  3. Kiểm tra tin nhắn: "Bạn có chắc muốn xóa tài khoản <tên>?"
  4. Kiểm tra nút: "Xóa" (đỏ/dangerous) và "Hủy"

Kết quả mong đợi: PASS
```

### TC4.2: Xóa tài khoản thành công
```
Mục tiêu: Kiểm tra xóa tài khoản hoàn thành
Điều kiên tiên quyết: Dialog xóa đã mở
Các bước:
  1. Click nút "Xóa"
  2. Dialog đóng
  3. Kiểm tra toast: "Xóa tài khoản thành công"
  4. Tài khoản bị xóa khỏi danh sách
  5. Phân trang cập nhật (nếu cần)

Kết quả mong đợi: PASS
```

### TC4.3: Hủy xóa tài khoản
```
Mục tiêu: Kiểm tra hủy xóa không xóa dữ liệu
Điều kiên tiên quyết: Dialog xóa đã mở
Các bước:
  1. Click nút "Hủy"
  2. Dialog đóng
  3. Tài khoản vẫn trong danh sách
  4. Toast không hiển thị

Kết quả mong đợi: PASS
```

### TC4.4: Ghi log hoạt động khi xóa
```
Mục tiêu: Kiểm tra audit log được ghi khi xóa
Điều kiên tiên quyết: Tài khoản đã bị xóa
Các bước:
  1. Chuyển sang tab "Lịch sử hoạt động"
  2. Kiểm tra log mới ở đầu danh sách
  3. Kiểm tra log có thông tin: tên tài khoản, hành động "Xóa tài khoản", kết quả "Thành công"

Kết quả mong đợi: PASS
```

---

## **Test Suite 5: Khóa/mở khóa tài khoản (Lock/Unlock)**

### TC5.1: Khóa tài khoản hoạt động
```
Mục tiêu: Kiểm tra khóa tài khoản từ "Hoạt động" → "Bị khóa"
Điều kiên tiên quyết: Danh sách tài khoản, tài khoản có trạng thái "Hoạt động"
Các bước:
  1. Xác định tài khoản có trạng thái "Hoạt động" (badge xanh)
  2. Click icon khóa (Lock icon)
  3. Kiểm tra trạng thái thay đổi: "Bị khóa" (badge đỏ)
  4. Kiểm tra toast: "Khóa tài khoản thành công"

Kết quả mong đợi: PASS
```

### TC5.2: Mở khóa tài khoản
```
Mục tiêu: Kiểm tra mở khóa tài khoản từ "Bị khóa" → "Hoạt động"
Điều kiên tiên quyết: Danh sách tài khoản, tài khoản có trạng thái "Bị khóa"
Các bước:
  1. Xác định tài khoản có trạng thái "Bị khóa" (badge đỏ)
  2. Click icon mở khóa (Unlock icon)
  3. Kiểm tra trạng thái thay đổi: "Hoạt động" (badge xanh)
  4. Kiểm tra toast: "Mở khóa tài khoản thành công"

Kết quả mong đợi: PASS
```

### TC5.3: Ghi log hoạt động khi khóa/mở khóa
```
Mục tiêu: Kiểm tra audit log ghi nhận khóa/mở khóa
Điều kiên tiên quyết: Tài khoản đã khóa hoặc mở khóa
Các bước:
  1. Chuyển sang tab "Lịch sử hoạt động"
  2. Kiểm tra log mới ở đầu danh sách
  3. Kiểm tra log có hành động "Khóa tài khoản"

Kết quả mong đợi: PASS
```

### TC5.4: Toggle khóa/mở khóa liên tiếp
```
Mục tiêu: Kiểm tra toggle khóa/mở khóa nhiều lần
Điều kiên tiên quyết: Danh sách tài khoản
Các bước:
  1. Khóa tài khoản → trạng thái = "Bị khóa"
  2. Mở khóa → trạng thái = "Hoạt động"
  3. Khóa lại → trạng thái = "Bị khóa"
  4. Kiểm tra không có lỗi

Kết quả mong đợi: PASS
```

---

## **Test Suite 6: Lịch sử hoạt động (Audit Log)**

### TC6.1: Hiển thị tab lịch sử hoạt động
```
Mục tiêu: Kiểm tra tab "Lịch sử hoạt động" hiển thị đúng
Điều kiên tiên quyết: Trang Account Management đã tải
Các bước:
  1. Click tab "Lịch sử hoạt động"
  2. Kiểm tra 20 log hoạt động hiển thị (phân trang 5 bản ghi/trang)
  3. Kiểm tra cột: Thời gian | Tài khoản | Hành động | Địa chỉ IP | Kết quả

Kết quả mong đợi: PASS
```

### TC6.2: Tìm kiếm theo tên tài khoản trong audit log
```
Mục tiêu: Kiểm tra tìm kiếm log theo tên tài khoản
Điều kiên tiên quyết: Tab "Lịch sử hoạt động" đã mở
Các bước:
  1. Nhập "an.nguyen" vào ô tìm kiếm
  2. Kiểm tra chỉ hiển thị log của "an.nguyen"
  3. Xóa tìm kiếm → danh sách khôi phục

Kết quả mong đợi: PASS
```

### TC6.3: Lọc theo loại hành động
```
Mục tiêu: Kiểm tra lọc log theo hành động
Điều kiên tiên quyết: Tab "Lịch sử hoạt động" đã mở
Các bước:
  1. Chọn "Đăng nhập" → chỉ hiển thị log "Đăng nhập"
  2. Chọn "Tạo tài khoản" → chỉ hiển thị log "Tạo tài khoản"
  3. Chọn "Khóa tài khoản" → chỉ hiển thị log "Khóa tài khoản"
  4. Chọn "Tất cả hành động" → hiển thị tất cả

Dữ liệu kiểm thử:
  - "Đăng nhập", "Đổi mật khẩu", "Tạo tài khoản", "Khóa tài khoản", "Sửa tài khoản"

Kết quả mong đợi: PASS
```

### TC6.4: Kết hợp tìm kiếm và lọc log
```
Mục tiêu: Kiểm tra tìm kiếm + lọc hoạt động trên log
Điều kiên tiên quyết: Tab "Lịch sử hoạt động" đã mở
Các bước:
  1. Nhập tìm kiếm: "an.nguyen"
  2. Chọn lọc: "Tạo tài khoản"
  3. Kiểm tra chỉ hiển thị log "Tạo tài khoản" của "an.nguyen"

Kết quả mong đợi: PASS
```

### TC6.5: Phân trang log hoạt động
```
Mục tiêu: Kiểm tra phân trang log (5 bản ghi/trang)
Điều kiên tiên quyết: Tab "Lịch sử hoạt động" đã mở
Các bước:
  1. Trang 1: hiển thị log 1-5
  2. Click "Tiếp" → trang 2: hiển thị log 6-10
  3. Click "Tiếp" → trang 3: hiển thị log 11-15
  4. Click "Tiếp" → trang 4: hiển thị log 16-20
  5. Kiểm tra nút "Tiếp" bị disable trên trang 4

Kết quả mong đợi: PASS
```

### TC6.6: Xóa bộ lọc log
```
Mục tiêu: Kiểm tra xóa bộ lọc reset tìm kiếm + lọc log
Điều kiên tiên quyết: Tab "Lịch sử hoạt động" có tìm kiếm/lọc
Các bước:
  1. Nhập tìm kiếm + chọn lọc
  2. Click "Xóa bộ lọc"
  3. Tìm kiếm và lọc được xóa
  4. Danh sách reset về trang 1

Kết quả mong đợi: PASS
```

---

## **Test Suite 7: Kiểm thử UI/UX**

### TC7.1: Toast notification "Tạo tài khoản thành công"
```
Mục tiêu: Kiểm tra toast hiển thị đúng khi tạo tài khoản
Điều kiên tiên quyết: Tài khoản mới đã được tạo
Các bước:
  1. Kiểm tra toast xuất hiện
  2. Kiểm tra text: "Tạo tài khoản thành công"
  3. Kiểm tra màu: xanh lá (success)
  4. Toast tự động ẩn sau ~3 giây

Kết quả mong đợi: PASS
```

### TC7.2: Loading state khi khởi tạo trang
```
Mục tiêu: Kiểm tra loading skeleton hiển thị
Điều kiên tiên quyết: Trang vừa tải
Các bước:
  1. Kiểm tra TableLoadingSkeleton hiển thị (500ms)
  2. Kiểm tra 5 dòng skeleton

Kết quả mong đợi: PASS
```

### TC7.3: EmptyState khi không có kết quả tìm kiếm
```
Mục tiêu: Kiểm tra EmptyState hiển thị đúng
Điều kiên tiên quyết: Tìm kiếm "nonexistent"
Các bước:
  1. Kiểm tra thông báo: "Không tìm thấy tài khoản"
  2. Kiểm tra mô tả: "Không có dữ liệu phù hợp với bộ lọc của bạn"
  3. Kiểm tra nút "Xóa bộ lọc" hiển thị

Kết quả mong đợi: PASS
```

### TC7.4: Badge màu vai trò (Role Badge)
```
Mục tiêu: Kiểm tra badge màu vai trò hiển thị đúng
Điều kiên tiên quyết: Danh sách tài khoản đã tải
Các bước:
  1. Admin: badge xanh dương (bg-blue-100)
  2. Doctor: badge xanh lá (bg-emerald-100)
  3. Reception: badge xám (bg-slate-100)

Kết quả mong đợi: PASS
```

### TC7.5: Badge trạng thái (Status Badge)
```
Mục tiêu: Kiểm tra badge trạng thái hiển thị đúng
Điều kiên tiên quyết: Danh sách tài khoản đã tải
Các bước:
  1. "Hoạt động": badge xanh lá (bg-emerald-100)
  2. "Bị khóa": badge đỏ (bg-rose-100)

Kết quả mong đợi: PASS
```

### TC7.6: Responsive trên mobile
```
Mục tiêu: Kiểm tra giao diện hoạt động trên mobile (320px)
Điều kiên tiên quyết: Trang Account Management
Các bước:
  1. Resize browser về 320px (mobile)
  2. Kiểm tra bố cục không bị vỡ
  3. Kiểm tra các nút hoạt động đúng
  4. Kiểm tra bảng có thể cuộn ngang

Kết quả mong đợi: PASS
```

---

## **Test Suite 8: Kiểm thử Edge Cases**

### TC8.1: Dữ liệu đầu vào với ký tự đặc biệt
```
Mục tiêu: Kiểm tra xử lý ký tự đặc biệt
Điều kiên tiên quyết: Modal thêm tài khoản đã mở
Các bước:
  1. Nhập Họ tên: "Nguyễn Thị An <script>" (có ký tự đặc biệt)
  2. Kiểm tra dữ liệu được lưu an toàn
  3. Kiểm tra không có XSS

Kết quả mong đợi: PASS
```

### TC8.2: Dữ liệu đầu vào với khoảng trắng
```
Mục tiêu: Kiểm tra xử lý khoảng trắng
Điều kiên tiên quyết: Modal thêm tài khoản đã mở
Các bước:
  1. Nhập Username: "  an.nguyen  " (khoảng trắng đầu/cuối)
  2. Kiểm tra khoảng trắng được trim
  3. Kiểm tra lưu đúng: "an.nguyen"

Kết quả mong đợi: PASS
```

### TC8.3: Phân trang khi xóa hết bản ghi trên trang
```
Mục tiêu: Kiểm tra phân trang khi xóa bản ghi cuối trang
Điều kiên tiên quyết: Trang với 5 bản ghi được tạo
Các bước:
  1. Ở trang 3 (5 bản ghi)
  2. Xóa 5 bản ghi
  3. Kiểm tra quay về trang 1 hoặc trang trước đó

Kết quả mong đợi: PASS
```

### TC8.4: Tìm kiếm case-insensitive
```
Mục tiêu: Kiểm tra tìm kiếm không phân biệt hoa thường
Điều kiên tiên quyết: Danh sách tài khoản
Các bước:
  1. Tìm kiếm "AN.NGUYEN" (chữ hoa)
  2. Kiểm tra kết quả chứa "an.nguyen"
  3. Tìm kiếm "An.NgUyEn" (hỗn hợp)
  4. Kiểm tra kết quả vẫn khớp

Kết quả mong đợi: PASS
```

### TC8.5: Modal không bị lỗi khi mở lại sau khi hủy
```
Mục tiêu: Kiểm tra modal trạng thái sau hủy
Điều kiên tiên quyết: Modal đã mở và hủy
Các bước:
  1. Mở modal thêm tài khoản
  2. Nhập dữ liệu
  3. Hủy modal
  4. Mở lại modal
  5. Kiểm tra form trống, reset lại

Kết quả mong đợi: PASS
```

---

## 9. Ghi chú kiểm thử

### Dữ liệu mock
- 15 tài khoản với các vai trò: Admin (5), Doctor (5), Reception (5)
- 20 log hoạt động
- Dữ liệu được reset mỗi lần tải lại trang

### Validators sử dụng
- `validateRequired`: kiểm tra trường bắt buộc
- `validateUsername`: format username (chữ thường, dấu chấm, 4+ ký tự)
- `validateEmail`: format email hợp lệ
- `validatePassword`: 8+ ký tự, 1 chữ hoa, 1 số

### Toast types
- `success` (xanh): Tạo, cập nhật, xóa, khóa/mở khóa thành công
- `error` (đỏ): Lỗi validation hoặc thao tác
- `info` (xanh dương): Thông tin chung

### Confirm dialog
- Sử dụng cho xóa tài khoản (isDangerous=true)
- Nút xác nhận "Xóa", nút hủy "Hủy"

---

## 10. Tiêu chí kết thúc kiểm thử

✅ **Kiểm thử hoàn thành khi:**
- Tất cả 50+ test cases pass
- Không có lỗi JavaScript trong console
- Validation hoạt động đúng cho tất cả trường
- CRUD operations hoạt động đúng
- Audit log ghi nhận chính xác
- Toast/confirm hiển thị đúng
- Responsive design hoạt động trên mobile/tablet/desktop

❌ **Kiểm thử thất bại nếu:**
- Bất kỳ test case nào fail
- Lỗi validation không hoạt động đúng
- Dữ liệu không được lưu/xóa/cập nhật
- Toast/confirm không hiển thị
- Lỗi JavaScript trong console
