# Danh sách các element cần bổ sung thuộc tính `data-cy`

Team Frontend vui lòng bổ sung các thuộc tính `data-cy` sau vào các thẻ HTML tương ứng để hỗ trợ kiểm thử tự động Cypress.

## 1. Màn hình Đăng nhập (/login)
- `[data-cy=username]` (Input tên đăng nhập, hiện đang dùng `#username`)
- `[data-cy=password]` (Input mật khẩu, hiện đang dùng `[name=password]`)
- `[data-cy=btn-login]` (Nút Đăng nhập)
- `[data-cy=error-message]` (Thông báo lỗi đăng nhập)
- `[data-cy=account-locked-warning]` (Cảnh báo khóa tài khoản)

## 2. Màn hình Đặt lịch (/schedule/booking)
- `[data-cy=select-doctor]` (Dropdown chọn bác sĩ)
- `[data-cy=booking-date]` (Date picker chọn ngày)
- `[data-cy=shift-morning]`, `[data-cy=shift-afternoon]`, v.v. (Các ca khám)
- `[data-cy=patient-name]` (Input tên bệnh nhân)
- `[data-cy=patient-phone]` (Input SĐT)
- `[data-cy=btn-book]` (Nút Đặt lịch)
- `[data-cy=booking-success]` (Thông báo đặt thành công)
- `[data-cy=no-shift-msg]` (Thông báo không có ca trống)

## 3. Các thành phần chung (Global/Layout)
- `[data-cy=user-menu]` (Menu người dùng ở góc trên)
- `[data-cy=btn-logout]` (Nút Đăng xuất trong menu)
- `[data-cy=toast]` (Các thông báo pop-up/toast)

*(Danh sách sẽ được cập nhật thêm khi triển khai các module khác)*
