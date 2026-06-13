import csv
import os

# Đường dẫn file CSV đầu ra
output_path = os.path.join(os.path.dirname(__file__), '..', 'Test_Cases', 'TestCases_Nhom4_TinhLuong_Full.csv')

# Danh sách test cases
test_cases = []
tc_count = 1

def add_tc(use_case, name, steps, input_data, expected_result, tc_type="Positive"):
    global tc_count
    tc_id = f"TC_{use_case}_{tc_count:03d}"
    test_cases.append([tc_id, use_case, name, steps, input_data, expected_result, tc_type, "Chưa chạy"])
    tc_count += 1

# ==================== UC4.1: THIẾT LẬP MỨC TIỀN CƠ BẢN ====================
# Positive
add_tc("UC4.1", "Nhập mức lương cơ bản chuẩn", "Nhập số tiền > 0", "100000", "Lưu thành công, hiển thị 100.000")
add_tc("UC4.1", "Nhập mức lương cơ bản số lẻ", "Nhập số tiền", "123456", "Lưu thành công, hiển thị 123.456")
add_tc("UC4.1", "Nhập mức lương cơ bản lớn", "Nhập số tiền", "999999999", "Lưu thành công, định dạng tiền tệ đúng")
# Negative
add_tc("UC4.1", "Nhập mức lương cơ bản bằng 0", "Nhập số tiền = 0", "0", "Báo lỗi: Mức lương phải lớn hơn 0", "Negative")
add_tc("UC4.1", "Nhập mức lương cơ bản số âm", "Nhập số tiền < 0", "-50000", "Báo lỗi: Không được nhập số âm", "Negative")
add_tc("UC4.1", "Để trống mức lương", "Xóa trắng ô nhập", "[Rỗng]", "Báo lỗi: Vui lòng nhập mức tiền", "Negative")
add_tc("UC4.1", "Nhập chữ/ký tự đặc biệt", "Nhập chữ cái", "abc@#", "Báo lỗi hoặc không cho phép nhập chữ", "Negative")

# ==================== UC4.2: THIẾT LẬP HỆ SỐ CA ====================
# Positive
add_tc("UC4.2", "Hệ số ca hành chính chuẩn", "Nhập hệ số 1.0", "Thứ 2: 1.0", "Lưu thành công")
add_tc("UC4.2", "Hệ số ca ngoài giờ/cuối tuần", "Nhập hệ số 1.5", "Chủ nhật: 1.5", "Lưu thành công")
add_tc("UC4.2", "Hệ số ca mức tối đa (VD: Lễ tết)", "Nhập hệ số cao", "Lễ: 3.0", "Lưu thành công")
# Negative
add_tc("UC4.2", "Hệ số ca bằng 0", "Nhập hệ số", "0", "Báo lỗi: Hệ số phải lớn hơn 0", "Negative")
add_tc("UC4.2", "Hệ số ca âm", "Nhập hệ số", "-1.5", "Báo lỗi: Không được nhập số âm", "Negative")
add_tc("UC4.2", "Hệ số nhập chữ", "Nhập chữ", "Một phẩy năm", "Báo lỗi sai định dạng số", "Negative")

# ==================== UC4.3: HỆ SỐ CA PHỨC TẠP ====================
add_tc("UC4.3", "Thêm ca bệnh khó chuẩn", "Nhập tên và hệ số", "Nhổ răng khôn (0.5)", "Thêm thành công vào danh sách")
add_tc("UC4.3", "Thêm ca bệnh mức nhẹ", "Nhập hệ số nhỏ", "Trám răng (0.1)", "Thêm thành công")
add_tc("UC4.3", "Để trống tên bệnh lý", "Bỏ trống tên", "Tên: [Rỗng], Hệ số: 0.2", "Báo lỗi: Tên bệnh lý không được để trống", "Negative")
add_tc("UC4.3", "Hệ số bệnh lý âm", "Nhập hệ số", "Tên: ABC, Hệ số: -0.1", "Báo lỗi: Hệ số bệnh lý không hợp lệ", "Negative")

# ==================== UC4.4: TÍNH LƯƠNG BÁC SĨ (MATRIX COMBINATIONS) ====================
# Data Matrix: Doctor (1.3, 1.5, 1.7, 2.0, 2.5) x Shift (1.0, 1.5) x Patient (0, 0.2, 0.5)
doctors = {"Đại học": 1.3, "Thạc sỹ": 1.5, "Tiến sỹ": 1.7, "Phó giáo sư": 2.0, "Giáo sư": 2.5}
shifts = {"Ngày thường": 1.0, "Cuối tuần": 1.5}
patients = {"Không có ca khó": 0, "Có ca khó vừa": 0.2, "Có ca rất khó": 0.5}
hours = 4
base_salary = 100000

for doc_name, doc_coef in doctors.items():
    for shift_name, shift_coef in shifts.items():
        for pat_name, pat_coef in patients.items():
            # Quy đổi giờ
            converted_hours = hours * (shift_coef + pat_coef)
            # Tiền ca
            total_money = converted_hours * doc_coef * base_salary
            
            steps = "1. Mở phiếu lương\n2. Chọn BS {} (Hệ số {})\n3. Kiểm tra ca {} (Hệ số {}, giờ = {}) với bệnh nhân {}".format(
                doc_name, doc_coef, shift_name, shift_coef, hours, pat_name
            )
            input_data = f"BS: {doc_coef}, Ca: {shift_coef}, Khó: {pat_coef}, LươngCB: 100k, Giờ: 4"
            expected = f"Số giờ QĐ = 4*({shift_coef}+{pat_coef}) = {converted_hours:.2f}. Tiền = {converted_hours:.2f} * {doc_coef} * 100k = {int(total_money)} VND"
            
            add_tc("UC4.4", f"Lương BS {doc_name} - {shift_name} - {pat_name}", steps, input_data, expected)

# Thêm Edge cases cho UC4.4
add_tc("UC4.4", "Bác sĩ không làm việc ca nào", "Xem phiếu lương BS không có lịch", "Tháng: 05/2026, BS không có ca trực", "Phiếu lương trống, tổng tiền = 0")
add_tc("UC4.4", "Ca trực 0 giờ", "Dữ liệu ca trực bị lỗi 0 giờ", "Giờ làm = 0", "Tiền = 0", "Negative/Edge")

# ==================== UC4.5: BÁO CÁO THÁNG ====================
add_tc("UC4.5", "Xem báo cáo tháng hiện tại", "Chọn tháng này", "05/2026", "Hiển thị đầy đủ danh sách BS làm việc và quỹ lương")
add_tc("UC4.5", "Xem báo cáo tháng tương lai", "Chọn tháng tương lai", "12/2099", "Báo cáo trống, quỹ lương = 0")
add_tc("UC4.5", "Xuất file Excel báo cáo", "Bấm xuất Excel", "Tháng 05/2026", "Tải xuống file Excel chứa đúng dữ liệu trên màn hình")

# ==================== UC4.6 & UC4.7: BÁO CÁO NĂM ====================
add_tc("UC4.6", "Báo cáo năm của BS có việc làm đủ 12 tháng", "Chọn BS làm cả năm", "2026, BS Nguyễn Văn A", "Biểu đồ cột đủ 12 tháng, không có tháng nào 0")
add_tc("UC4.6", "Báo cáo năm của BS mới vào làm", "Chọn BS mới vào tháng 6", "2026, BS mới", "Tháng 1-5 biểu đồ = 0, từ tháng 6 có số liệu")
add_tc("UC4.7", "Báo cáo quỹ lương năm toàn phòng khám", "Chọn năm", "2026", "Tổng tiền khớp với phép cộng 12 tháng của tất cả BS")

# Ghi ra CSV
with open(output_path, mode='w', encoding='utf-8-sig', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['Mã TC', 'Use Case', 'Tên Test Case', 'Các bước thực hiện', 'Dữ liệu đầu vào', 'Kết quả mong đợi', 'Loại Test', 'Trạng thái'])
    for tc in test_cases:
        writer.writerow(tc)

print(f"Đã tạo thành công {len(test_cases)} test cases tại {output_path}")
