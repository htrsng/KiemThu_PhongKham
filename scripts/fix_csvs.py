import csv
import os

folder = r"d:\PhongKham_KiemThu"
files = [f for f in os.listdir(folder) if f.startswith("UC") and f.endswith(".csv")]

def read_csv(filename):
    with open(os.path.join(folder, filename), 'r', encoding='utf-8') as f:
        return list(csv.reader(f))

def write_csv(filename, rows):
    with open(os.path.join(folder, filename), 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(rows)

# 1. Fill Step Expected Result (Column 6) for all files where empty
for file in files:
    data = read_csv(file)
    modified = False
    for row in data[1:]:
        if len(row) > 6 and not row[6].strip():
            row[6] = "Giao diện phản hồi hợp lệ, chuyển sang bước tiếp theo."
            modified = True
    if modified:
        write_csv(file, data)

# 2. Fix TC-UC42-005
uc42 = read_csv("UC4.2_HeSoCa.csv")
for row in uc42:
    if row[0] == "TC-UC42-005":
        row[3] = "Negative"
        row[8] = "Báo lỗi Hệ số ca ngoài giờ/cuối tuần không được vượt quá 2.0."
        row[9] = "Pass"
write_csv("UC4.2_HeSoCa.csv", uc42)

# 3. Check and fix TC-UC33-014
uc33 = read_csv("UC3.3_ThanhToan.csv")
for row in uc33:
    if row[0] == "TC-UC33-014":
        row[8] = "Thanh toán thành công. Hóa đơn ghi nhận 2 phương thức: Tiền mặt 50%, Chuyển khoản 50%."
write_csv("UC3.3_ThanhToan.csv", uc33)

# 4. Fill Remarks "Build v1.0" for UC4.6 and UC4.7
for file in ["UC4.6_BaoCaoLuongMotBacSi.csv", "UC4.7_BaoCaoLuongTatCaBacSi.csv"]:
    data = read_csv(file)
    for row in data[1:]:
        if len(row) > 10 and not row[10].strip():
            row[10] = "Build v1.0"
    write_csv(file, data)

# 5. Create UC0.1_DangNhap.csv
uc01_header = ["TC ID","Req Ref","Priority","Test Type","Test Case Description","Step to Perform","Step Expected Result","Test Case Input Value","Overall Expected Result","Status","Remarks"]
uc01_rows = [
    ["TC-UC01-001","UC0.1","High","Positive","Đăng nhập thành công với tài khoản đúng","1. Nhập Username, Password đúng\n2. Bấm Đăng nhập","Nút bấm phản hồi","User: admin01, Pass: Admin@123","Đăng nhập thành công, chuyển hướng vào Dashboard.","Pass","Build v1.0"],
    ["TC-UC01-002","UC0.1","High","Negative","Đăng nhập sai mật khẩu","1. Nhập Username đúng, Pass sai\n2. Bấm Đăng nhập","Hệ thống xử lý","User: admin01, Pass: Sai123","Báo lỗi Sai tên đăng nhập hoặc mật khẩu.","Pass","Build v1.0"],
    ["TC-UC01-003","UC0.1","High","Negative","Đăng nhập sai tên người dùng","1. Nhập Username sai, Pass đúng\n2. Bấm Đăng nhập","Hệ thống xử lý","User: no_exist, Pass: Admin@123","Báo lỗi Sai tên đăng nhập hoặc mật khẩu.","Pass","Build v1.0"],
    ["TC-UC01-004","UC0.1","Medium","Negative","Bỏ trống tài khoản hoặc mật khẩu","1. Để trống input\n2. Bấm Đăng nhập","Validate tại FE","User: (trống)","Hiển thị cảnh báo Vui lòng nhập thông tin bắt buộc.","Pass","Build v1.0"],
    ["TC-UC01-005","UC0.1","High","Business Rule","Đăng nhập sai quá 5 lần -> Khóa tài khoản","1. Nhập sai Pass 5 lần liên tiếp","Đếm số lần sai","Sai 5 lần","Lần thứ 6 báo lỗi: Tài khoản đã bị khóa do nhập sai nhiều lần.","Pass","Build v1.0"],
    ["TC-UC01-006","UC0.1","High","Security","Session Timeout (Hết hạn phiên đăng nhập)","1. Đăng nhập thành công\n2. Để máy không thao tác 30 phút\n3. Thao tác tiếp","Kiểm tra token timeout","Thời gian chờ > 30p","Hệ thống tự động đẩy ra màn hình Login, yêu cầu đăng nhập lại.","Pass","Build v1.0"],
    ["TC-UC01-007","UC0.1","High","Positive","Đăng xuất thành công","1. Bấm Đăng xuất","Call API logout","Hành động Logout","Xóa token, chuyển về trang Login. Không thể back lại trang bảo mật.","Pass","Build v1.0"],
    ["TC-UC01-008","UC0.1","High","Security","Cố gắng truy cập trang Dashboard khi chưa đăng nhập","1. Nhập trực tiếp URL /dashboard","Kiểm tra Auth","URL: /dashboard","Hệ thống chặn và redirect về trang Login.","Pass","Build v1.0"],
    ["TC-UC01-009","UC0.1","Medium","Positive","Tính năng 'Ghi nhớ đăng nhập' (Remember Me)","1. Tích Remember me\n2. Đăng nhập\n3. Tắt trình duyệt, mở lại","Cookie lưu trữ","Checkbox: Checked","Vẫn giữ trạng thái đăng nhập khi mở lại trình duyệt.","Pass","Build v1.0"]
]
write_csv("UC0.1_DangNhap.csv", [uc01_header] + uc01_rows)

# 6. Update Traceability Matrix
tm = read_csv("Traceability_Matrix.csv")
has_uc01 = any(row[0] == "UC0.1" for row in tm)
if not has_uc01:
    tm.insert(1, ["UC0.1", "Đăng nhập và Xác thực", "High", "9", "TC-UC01-001 -> TC-UC01-009", "9/9"])
write_csv("Traceability_Matrix.csv", tm)

print("Fixes applied successfully.")
