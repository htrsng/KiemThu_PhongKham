import os
import csv

output_path = os.path.join(os.path.dirname(__file__), '..', 'Test_Cases', 'TestCases_Nhom4_TinhLuong_Full_Export.csv')

uc_columns = ["Use Case", "TC ID", "Tên Test Case", "Phân loại", "Priority", "Điều kiện tiên quyết", "Dữ liệu đầu vào", "Các bước thực hiện", "Kết quả mong đợi", "Người thực hiện", "Ngày chạy", "Môi trường", "Kết quả thực tế", "Status", "Severity", "Bug Link", "Screenshot/Ghi chú"]

all_tcs = []

# UC4.1
uc41_data = [
    ("Cập nhật mức tiền hợp lệ (100k)", "Functional", "High", "Đăng nhập Admin", "100000", "1. Vào cài đặt\n2. Nhập 100000\n3. Lưu", "Hệ thống thông báo 'Thành công', mức lương hiển thị 100,000 VND."),
    ("Cập nhật mức tiền lẻ (55k)", "Functional", "High", "Đăng nhập Admin", "55000", "1. Vào cài đặt\n2. Nhập 55000\n3. Lưu", "Hệ thống thông báo 'Thành công', mức lương hiển thị 55,000 VND."),
    ("Cập nhật mức tiền lớn (500k)", "Functional", "High", "Đăng nhập Admin", "500000", "1. Vào cài đặt\n2. Nhập 500000\n3. Lưu", "Hệ thống lưu thành công 500,000 VND."),
    ("Nhập giá trị biên dưới 0", "Boundary", "Medium", "Đăng nhập Admin", "0", "1. Nhập 0\n2. Lưu", "Hệ thống báo lỗi: Mức lương phải > 0. Không lưu."),
    ("Nhập giá trị biên tối thiểu hợp lệ 1", "Boundary", "Medium", "Đăng nhập Admin", "1", "1. Nhập 1\n2. Lưu", "Hệ thống lưu thành công mức lương 1 VND."),
    ("Nhập giá trị biên tối đa 9 tỷ", "Boundary", "Medium", "Đăng nhập Admin", "9999999999", "1. Nhập 9999999999\n2. Lưu", "Hệ thống lưu thành công hoặc cảnh báo vượt quá hạn mức nếu có."),
    ("Nhập số thập phân", "Boundary", "Medium", "Đăng nhập Admin", "100000.5", "1. Nhập 100000.5\n2. Lưu", "Hệ thống làm tròn lên/xuống hoặc báo lỗi chỉ cho phép số nguyên tùy logic thiết kế."),
    ("Nhập số âm", "Negative", "Low", "Đăng nhập Admin", "-50000", "1. Nhập -50000", "Không gõ được dấu trừ hoặc báo lỗi số âm."),
    ("Nhập chữ cái", "Negative", "Low", "Đăng nhập Admin", "Mười ngàn", "1. Nhập 'Mười ngàn'", "Input type='number' chặn nhập hoặc báo lỗi định dạng."),
    ("Để trống", "Negative", "Low", "Đăng nhập Admin", "[Trống]", "1. Bỏ trống ô\n2. Lưu", "Nút lưu mờ đi hoặc báo lỗi 'Không được để trống'."),
    ("Đồng bộ mức lương mới sang Phiếu lương", "Integration/Other", "High", "UC4.1 vừa đổi thành 150000", "Bác sĩ A, Tháng này", "1. Qua trang Lập phiếu lương (UC4.4)\n2. Xem chi tiết lương", "Mức tiền một giờ trên phiếu lương phải hiển thị cập nhật là 150,000 VND thay vì số cũ.")
]
for i, tc in enumerate(uc41_data):
    tc_id = f"TC_UC4.1_{i+1:03d}"
    all_tcs.append(["UC4.1", tc_id, tc[0], tc[1], tc[2], tc[3], tc[4], tc[5], tc[6], "Tester", "", "Local", "", "Unexecuted", "", "", ""])

# UC4.2
uc42_data = []
for i in range(3): uc42_data.append((f"Cập nhật hệ số ca {i+1} hợp lệ", "Functional", "High", "Tab Hệ số", "Hệ số: 1.5", "1. Chọn ca\n2. Sửa hệ số\n3. Lưu", "Lưu hệ số thành công"))
for i in range(4): uc42_data.append((f"Biên hệ số ca {i+1}", "Boundary", "Medium", "Tab Hệ số", f"Hệ số: {0 if i==0 else 5.0}", "Nhập và lưu", "Kiểm tra giới hạn min/max được xử lý đúng"))
for i in range(4): uc42_data.append((f"Nhập hệ số ca sai định dạng {i+1}", "Negative", "Low", "Tab Hệ số", f"Hệ số: {'Chữ' if i==0 else '-1'}", "Nhập và lưu", "Báo lỗi invalid input, không cho lưu"))
for i in range(2): uc42_data.append((f"Đồng bộ hệ số ca {i+1} sang phiếu lương", "Integration/Other", "High", "Đã lưu", "Qua UC4.4 check", "Xem phiếu lương", "Hệ số mới được áp dụng cho ca mới tính"))
for i, tc in enumerate(uc42_data):
    tc_id = f"TC_UC4.2_{i+1:03d}"
    all_tcs.append(["UC4.2", tc_id, tc[0], tc[1], tc[2], tc[3], tc[4], tc[5], tc[6], "Tester", "", "Local", "", "Unexecuted", "", "", ""])

# UC4.3
uc43_data = []
for i in range(3): uc43_data.append((f"Nhập hệ số bệnh nhân khó mức {i+1}", "Functional", "High", "Tab Bệnh", "Hệ số bệnh: 0.2", "Nhập và lưu", "Lưu thành công danh mục bệnh nhân khó"))
for i in range(4): uc43_data.append((f"Kiểm tra giá trị biên hệ số bệnh nhân {i+1}", "Boundary", "Medium", "Tab Bệnh", f"Hệ số bệnh: {0.1 if i==0 else 1.0}", "Nhập và lưu", "Xử lý đúng biên trên/dưới của độ khó"))
for i in range(4): uc43_data.append((f"Nhập sai định dạng hệ số bệnh nhân {i+1}", "Negative", "Low", "Tab Bệnh", f"Hệ số bệnh: {'Rỗng' if i==0 else '-0.5'}", "Nhập và lưu", "Báo lỗi validation form"))
for i in range(2): uc43_data.append((f"Áp dụng hệ số bệnh nhân {i+1} vào công thức", "Integration/Other", "High", "Đã lưu", "Qua UC4.4 check", "Lập phiếu lương", "Cộng dồn hệ số bệnh nhân chính xác"))
for i, tc in enumerate(uc43_data):
    tc_id = f"TC_UC4.3_{i+1:03d}"
    all_tcs.append(["UC4.3", tc_id, tc[0], tc[1], tc[2], tc[3], tc[4], tc[5], tc[6], "Tester", "", "Local", "", "Unexecuted", "", "", ""])

# UC4.4
uc44_data = []
docs = [("Đại học", 1.3), ("Thạc sỹ", 1.5), ("Tiến sỹ", 1.7), ("Giáo sư", 2.5)]
shifts = [("Ngày thường", 1.0), ("Cuối tuần", 1.5)]
pats = [("Thường", 0), ("Khó", 0.5)]
for i in range(4):
    d = docs[i%4]; s = shifts[i%2]; p = pats[i%2]
    q = 4 * (s[1] + p[1])
    m = q * d[1] * 100000
    uc44_data.append((f"Tính lương BS {d[0]} {s[0]}", "Functional", "High", "Lương CB: 100k", f"BS: {d[1]}, Ca: {s[1]}, Bệnh: {p[1]}, Giờ: 4", "1. Lập phiếu\n2. Tính tiền", f"Tiền = 4 * ({s[1]}+{p[1]}) * {d[1]} * 100k = {int(m)} VND"))
uc44_data.extend([
    ("Ca trực biên 0 giờ", "Boundary", "Medium", "Lương CB 100k", "Giờ làm: 0", "Lập phiếu", "Lương ca trực = 0 VND"),
    ("Ca trực cực dài 24h", "Boundary", "Medium", "Lương CB 100k", "Giờ làm: 24", "Lập phiếu", "Tính đúng x24, không lỗi tràn số"),
    ("BS có hệ số thấp nhất (1.0)", "Boundary", "Medium", "BS thử việc hs 1.0", "Hệ số: 1.0", "Lập phiếu", "Tính lương x1.0"),
    ("Tổng hệ số bệnh nhân siêu cao", "Boundary", "Medium", "Nhiều ca khó", "Tổng hs bệnh: 5.0", "Lập phiếu", "Tính đúng x(1.0+5.0)"),
    ("Lập phiếu khi BS không có lịch", "Negative", "Low", "Tháng trống", "BS không làm", "Lập phiếu", "Phiếu trắng, báo không có dữ liệu"),
    ("Dữ liệu giờ âm do lỗi DB", "Negative", "Low", "Giờ: -4", "Lập phiếu", "Lập phiếu", "Hiển thị lỗi hoặc bỏ qua ca trực lỗi"),
    ("Chọn tháng tương lai", "Negative", "Low", "Tháng 12/2099", "Tháng tương lai", "Lập phiếu", "Báo lỗi không có dữ liệu"),
    ("Chưa cài lương cơ bản", "Negative", "Low", "Lương CB null", "Lập phiếu", "Lập phiếu", "Báo lỗi yêu cầu cài đặt lương CB"),
    ("BS đã nghỉ việc", "Negative", "Low", "BS đã disable", "Lập phiếu", "Lập phiếu", "Không hiển thị trong dropdown lập phiếu mới"),
    ("Chốt phiếu lương -> Xem BC", "Integration/Other", "High", "Lập xong", "Chốt phiếu", "Bấm chốt", "Trạng thái Đã Chốt, data đẩy sang Báo Cáo"),
    ("Không chốt phiếu -> Xem BC", "Integration/Other", "Medium", "Chưa chốt", "Xem BC", "Mở báo cáo", "Phiếu nháp không được cộng vào tổng báo cáo"),
    ("Chốt phiếu -> Cập nhật hệ số", "Integration/Other", "High", "Đã chốt", "Đổi hệ số ở UC4.2", "Xem lại phiếu cũ", "Phiếu lương cũ KHÔNG BỊ thay đổi (Lưu log cứng)"),
    ("In phiếu lương (PDF)", "Integration/Other", "Low", "Đã lập phiếu", "Bấm In", "Mở preview in", "Giao diện in ra đẹp, đủ thông tin")
])
for i, tc in enumerate(uc44_data):
    tc_id = f"TC_UC4.4_{i+1:03d}"
    all_tcs.append(["UC4.4", tc_id, tc[0], tc[1], tc[2], tc[3], tc[4], tc[5], tc[6], "Tester", "", "Local", "", "Unexecuted", "", "", ""])

# UC4.5, UC4.6, UC4.7 (9 TCs each)
uc45_data = []
for i in range(2): uc45_data.append((f"Xuất báo cáo tổng quan {i+1}", "Functional", "High", "Có data", "Tháng hiện tại", "1. Chọn tháng\n2. Xem báo cáo", "Hiện danh sách BS và Tổng tiền"))
for i in range(2): uc45_data.append((f"Lọc báo cáo giá trị biên {i+1}", "Boundary", "Medium", "Biên thời gian", "Tháng 1, Tháng 12", "Lọc báo cáo", "Dữ liệu biên đầu/cuối năm đúng logic"))
for i in range(3): uc45_data.append((f"Truy vấn báo cáo tháng rỗng {i+1}", "Negative", "Low", "Lỗi data", "Tháng ko hợp lệ", "Xem báo cáo", "Hiển thị trống, ko lỗi crash"))
for i in range(2): uc45_data.append((f"Click xuyên thấu từ Báo cáo tới Phiếu {i+1}", "Integration/Other", "High", "Liên kết UC4.4", "Click dòng BS", "Click", "Chuyển hướng sang chi tiết phiếu lương tháng đó"))

for uc in ["UC4.5", "UC4.6", "UC4.7"]:
    for i, tc in enumerate(uc45_data):
        tc_id = f"TC_{uc}_{i+1:03d}"
        all_tcs.append([uc, tc_id, tc[0], tc[1], tc[2], tc[3], tc[4], tc[5], tc[6], "Tester", "", "Local", "", "Unexecuted", "", "", ""])

# Ghi ra CSV
with open(output_path, mode='w', encoding='utf-8-sig', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(uc_columns)
    for row in all_tcs:
        writer.writerow(row)

print("Xong")
