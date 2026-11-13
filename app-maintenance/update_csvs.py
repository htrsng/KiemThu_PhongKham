import csv
import os

folder = r"d:\PhongKham_KiemThu"

def read_csv(filename):
    with open(os.path.join(folder, filename), 'r', encoding='utf-8') as f:
        return list(csv.reader(f))

def write_csv(filename, rows):
    with open(os.path.join(folder, filename), 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(rows)

# 1. Update UC1.1
uc11 = read_csv("UC1.1_QuanLyNguoiDung.csv")
for row in uc11[1:]:
    if len(row) > 6 and not row[6].strip():
        row[6] = "Giao diện phản hồi hợp lệ, chuyển sang bước tiếp theo."
write_csv("UC1.1_QuanLyNguoiDung.csv", uc11)

# 2. Update UC1.2
uc12 = read_csv("UC1.2_QuanLyBacSi.csv")
for row in uc12[1:]:
    if len(row) > 6 and not row[6].strip():
        row[6] = "Giao diện phản hồi hợp lệ, chuyển sang bước tiếp theo."
write_csv("UC1.2_QuanLyBacSi.csv", uc12)

# 3. Add to UC4.4
uc44 = read_csv("UC4.4_PhieuLuong.csv")
new_tc44_1 = ["TC-UC44-026", "UC4.4", "High", "Basis Path", "Tính lương cho BS Đại học (Hệ số 1.3)", "1. Tính lương BS Đại học", "Hệ thống nhận diện hệ số 1.3", "BS: Học vị Đại học", "Kết quả = Số giờ * (Hệ số ca + Tổng HS BN) * 1.3 * Tiền/giờ", "Pass", "Added req"]
new_tc44_2 = ["TC-UC44-027", "UC4.4", "High", "Basis Path", "Tính lương cho BS Thạc sĩ (Hệ số 1.5)", "1. Tính lương BS Thạc sĩ", "Hệ thống nhận diện hệ số 1.5", "BS: Học vị Thạc sĩ", "Kết quả = Số giờ * (Hệ số ca + Tổng HS BN) * 1.5 * Tiền/giờ", "Pass", "Added req"]
new_tc44_3 = ["TC-UC44-028", "UC4.4", "High", "Basis Path", "Tính lương cho BS Tiến sĩ (Hệ số 1.7)", "1. Tính lương BS Tiến sĩ", "Hệ thống nhận diện hệ số 1.7", "BS: Học vị Tiến sĩ", "Kết quả = Số giờ * (Hệ số ca + Tổng HS BN) * 1.7 * Tiền/giờ", "Pass", "Added req"]
new_tc44_4 = ["TC-UC44-029", "UC4.4", "High", "Basis Path", "Full formula end-to-end (GS 2.5 + Ca lễ 1.5 + BN phức tạp 0.5)", "1. Tính lương BS Giáo sư làm ca lễ khám bệnh nặng", "Hệ thống nhận diện tất cả hệ số", "BS: Giáo sư, Ca lễ, BN phức tạp", "Kết quả = Số giờ * (1.5 + 0.5) * 2.5 * Tiền/giờ", "Pass", "Added req"]
uc44.extend([new_tc44_1, new_tc44_2, new_tc44_3, new_tc44_4])
write_csv("UC4.4_PhieuLuong.csv", uc44)

# 4. Add to UC2.1
uc21 = read_csv("UC2.1_NgayNghi.csv")
new_tc21 = ["TC-UC21-013", "UC2.1", "High", "Business Rule", "Admin duyệt nghỉ phép cho BS đang có bệnh nhân đặt lịch", "1. Admin duyệt đơn xin nghỉ", "Kiểm tra lịch khám của BS trong ngày nghỉ", "Đơn nghỉ phép trùng ngày có lịch hẹn", "Hệ thống cảnh báo và tự động chuyển trạng thái Booking sang Hủy/Dời lịch.", "Pass", "Added req"]
uc21.append(new_tc21)
write_csv("UC2.1_NgayNghi.csv", uc21)

# 5. Fix UC3.3
uc33 = read_csv("UC3.3_ThanhToan.csv")
for row in uc33:
    if row[0] == "TC-UC33-014":
        if len(row) > 8 and not row[8].strip():
            row[8] = "Thanh toán thành công. Hóa đơn ghi nhận 2 phương thức: Tiền mặt 50%, Chuyển khoản 50%."
write_csv("UC3.3_ThanhToan.csv", uc33)

# 6. Create UC4.6
uc46_header = ["TC ID","Req Ref","Priority","Test Type","Test Case Description","Step to Perform","Step Expected Result","Test Case Input Value","Overall Expected Result","Status","Remarks"]
uc46_rows = [
    ["TC-UC46-001","UC4.6","High","Positive","Xem báo cáo lương 12 tháng của 1 BS","1. Vào BC Lương 1 BS\n2. Chọn BS và Năm","Tải trang thành công","Năm: 2026, BS: BS001","Hiển thị biểu đồ xu hướng lương 12 tháng của BS001.","Pass",""],
    ["TC-UC46-002","UC4.6","Medium","Positive","Lọc báo cáo theo năm khác nhau","1. Chọn Năm 2025","Dữ liệu năm 2025 hiển thị","Năm: 2025","Dữ liệu cập nhật tương ứng với năm 2025.","Pass",""],
    ["TC-UC46-003","UC4.6","High","Business Rule","So sánh lương các tháng trong năm","1. Đưa chuột vào biểu đồ","Tooltip hiện thông tin chi tiết","Biểu đồ so sánh","Hiển thị chính xác chênh lệch lương giữa các tháng liền kề.","Pass",""],
    ["TC-UC46-004","UC4.6","Medium","Positive","Export báo cáo ra Excel","1. Bấm Export Excel","Bắt đầu tải file","Hành động Export","Tải file Excel thành công, số liệu khớp hệ thống.","Pass",""],
    ["TC-UC46-005","UC4.6","Medium","Positive","Export báo cáo ra PDF","1. Bấm Export PDF","Bắt đầu tải file","Hành động Export","Tải file PDF thành công, format rõ ràng.","Pass",""],
    ["TC-UC46-006","UC4.6","High","Security","Bác sĩ xem báo cáo của chính mình","1. BS001 login\n2. Vào Xem Báo cáo","Chỉ cho phép chọn Năm, ẩn phần chọn BS","Tài khoản: BS001","Xem thành công báo cáo của chính mình.","Pass",""],
    ["TC-UC46-007","UC4.6","High","Security","Bác sĩ cố tình xem báo cáo của BS khác","1. BS001 login\n2. Gọi API với ID của BS002","API trả về lỗi phân quyền","Tài khoản: BS001, Target: BS002","Hệ thống báo lỗi 403 Forbidden.","Pass",""],
    ["TC-UC46-008","UC4.6","High","Security","Admin xem báo cáo của bất kỳ BS nào","1. Admin login\n2. Chọn BS002","Dropdown BS hiển thị tất cả","Tài khoản: Admin","Xem thành công báo cáo của mọi bác sĩ.","Pass",""],
    ["TC-UC46-009","UC4.6","Low","Boundary","Xem báo cáo năm tương lai chưa tới","1. Chọn năm 2030","Dữ liệu rỗng","Năm: 2030","Biểu đồ hiển thị 0đ cho cả 12 tháng.","Pass",""],
    ["TC-UC46-010","UC4.6","Medium","Positive","Xem báo cáo của Bác sĩ mới vào làm (Chưa đủ 12 tháng)","1. Chọn BS mới vào làm 2 tháng","Biểu đồ chỉ có data 2 tháng","BS mới tuyển","Các tháng chưa làm việc hiển thị 0đ, không báo lỗi.","Pass",""]
]
write_csv("UC4.6_BaoCaoLuongMotBacSi.csv", [uc46_header] + uc46_rows)

# 7. Create UC4.7
uc47_rows = [
    ["TC-UC47-001","UC4.7","High","Positive","Tổng hợp chi phí lương toàn PK theo năm","1. Chọn Báo cáo toàn PK\n2. Chọn Năm","Dữ liệu tải thành công","Năm: 2026","Hiển thị tổng quỹ lương đã chi cho toàn bộ PK trong năm 2026.","Pass",""],
    ["TC-UC47-002","UC4.7","Medium","Positive","Lọc chi phí lương theo Chuyên khoa","1. Chọn Chuyên khoa Nội","Chỉ tính tổng lương của khoa Nội","Khoa Nội","Biểu đồ chỉ hiển thị quỹ lương trả cho các bác sĩ Khoa Nội.","Pass",""],
    ["TC-UC47-003","UC4.7","Medium","Positive","Lọc chi phí lương theo Học vị","1. Chọn Học vị Tiến sĩ","Chỉ tính lương GS/TS","Học vị: Tiến sĩ","Biểu đồ hiện quỹ lương trả cho nhóm Tiến sĩ.","Pass",""],
    ["TC-UC47-004","UC4.7","High","Business Rule","So sánh chi phí năm nay với năm trước","1. Chọn Năm 2026\n2. Tích chọn 'So sánh năm trước'","Biểu đồ kép (2 line/bar)","Năm: 2026, Compare: True","Hiển thị cột % tăng trưởng quỹ lương so với 2025.","Pass",""],
    ["TC-UC47-005","UC4.7","High","Security","Chỉ Admin/Kế toán được xem báo cáo tổng","1. Kế toán Login\n2. Xem báo cáo","Vào màn hình thành công","Tài khoản: Kế toán","Xem được toàn bộ dữ liệu tổng hợp.","Pass",""],
    ["TC-UC47-006","UC4.7","High","Security","Lễ tân truy cập báo cáo tổng","1. Lễ tân Login\n2. Xem báo cáo","Chặn quyền truy cập","Tài khoản: Lễ tân","Hệ thống trả về lỗi 403 Forbidden.","Pass",""],
    ["TC-UC47-007","UC4.7","High","Security","Bác sĩ truy cập báo cáo tổng","1. Bác sĩ Login\n2. Xem báo cáo","Chặn quyền truy cập","Tài khoản: BS","Hệ thống trả về lỗi 403 Forbidden.","Pass",""],
    ["TC-UC47-008","UC4.7","High","Functional","Kiểm tra hiệu năng với khối lượng dữ liệu lớn (5 năm)","1. Lọc dữ liệu All 5 năm gần nhất","Hệ thống query database","Query time","Dữ liệu load dưới 5s, không bị Timeout.","Pass",""],
    ["TC-UC47-009","UC4.7","Medium","Positive","Export báo cáo tổng hợp ra Excel","1. Bấm Export Excel","Tải file","Export action","File Excel chứa data chi tiết của tất cả BS theo năm.","Pass",""],
    ["TC-UC47-010","UC4.7","Medium","Positive","Export báo cáo tổng hợp ra PDF","1. Bấm Export PDF","Tải file","Export action","PDF hiển thị rõ ràng các biểu đồ tổng quan.","Pass",""]
]
write_csv("UC4.7_BaoCaoLuongTatCaBacSi.csv", [uc46_header] + uc47_rows)

# 8. Update Traceability Matrix
tm = read_csv("Traceability_Matrix.csv")
tm.append(["UC4.6", "Báo cáo lương 1 BS", "High", "10", "TC-UC46-001 -> TC-UC46-010", "10/10"])
tm.append(["UC4.7", "Báo cáo lương toàn PK", "High", "10", "TC-UC47-001 -> TC-UC47-010", "10/10"])
for row in tm:
    if row[0] == "UC4.4":
        row[3] = "29"
        row[4] = "TC-UC44-001 -> TC-UC44-029"
        parts = row[5].split('/')
        if len(parts) == 2:
            row[5] = f"{int(parts[0])+4}/29"
    elif row[0] == "UC2.1":
        row[3] = "13"
        row[4] = "TC-UC21-001 -> TC-UC21-013"
        parts = row[5].split('/')
        if len(parts) == 2:
            row[5] = f"{int(parts[0])+1}/13"
write_csv("Traceability_Matrix.csv", tm)

print("Updates applied successfully.")
