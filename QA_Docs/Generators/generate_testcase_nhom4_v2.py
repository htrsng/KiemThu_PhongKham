import csv
import os

output_path = os.path.join(os.path.dirname(__file__), '..', 'Test_Cases', 'TestCases_Nhom4_TinhLuong_Chuan.csv')

test_cases = []
counters = {"UC4.1": 1, "UC4.2": 1, "UC4.3": 1, "UC4.4": 1, "UC4.5": 1, "UC4.6": 1, "UC4.7": 1}

def add_tc(use_case, name, desc, precond, input_data, steps, expected, test_type="Functional test"):
    tc_id = f"TC_{use_case}_{counters[use_case]:03d}"
    counters[use_case] += 1
    
    # Columns: ID, Tên, Mô tả, Điều kiện tiên quyết, Đầu vào, Các bước, Kết quả mong đợi, Thực tế, Pass/Fail, Ghi chú
    row = [
        tc_id, 
        name, 
        desc, 
        precond, 
        input_data, 
        steps, 
        expected, 
        "", # Kết quả thực tế
        "", # Pass/Fail
        f"Phân loại: {test_type}" # Ghi chú
    ]
    test_cases.append(row)

# ==================== UC4.1: THIẾT LẬP MỨC TIỀN CƠ BẢN ====================
add_tc("UC4.1", "Nhập mức tiền chuẩn", "Kiểm tra lưu mức lương hợp lệ", "Đăng nhập quyền Admin/Kế toán", "Số tiền: 100000", "1. Vào Cài đặt lương\n2. Nhập 100000\n3. Nhấn Lưu", "Hệ thống lưu thành công, hiển thị đúng 100,000 VND")
add_tc("UC4.1", "Kiểm tra điều kiện biên (Boundary) - Nhỏ nhất", "Kiểm tra với giá trị bằng 0", "Đăng nhập quyền Admin", "Số tiền: 0", "1. Nhập 0\n2. Nhấn Lưu", "Hệ thống hiển thị thông báo 'Mức lương cơ bản phải lớn hơn 0', không cho lưu", "Boundary test")
add_tc("UC4.1", "Kiểm tra điều kiện biên - Số âm", "Kiểm tra với giá trị âm", "Đăng nhập quyền Admin", "Số tiền: -50000", "1. Nhập -50000\n2. Nhấn Lưu", "Hệ thống chặn nhập dấu trừ hoặc báo lỗi 'Không được nhập số âm'", "Negative test")
add_tc("UC4.1", "Để trống trường dữ liệu", "Kiểm tra khi không nhập gì", "Đăng nhập quyền Admin", "Số tiền: [Rỗng]", "1. Xóa trắng ô nhập\n2. Nhấn Lưu", "Hệ thống báo lỗi 'Vui lòng nhập mức tiền', nút Lưu bị mờ", "Negative test")

# ==================== UC4.2: THIẾT LẬP HỆ SỐ CA ====================
add_tc("UC4.2", "Cập nhật hệ số cuối tuần", "Kiểm tra lưu hệ số > 1", "Đã vào tab Hệ số ca", "Thứ 7: 1.5, CN: 1.5", "1. Sửa Thứ 7 và CN thành 1.5\n2. Lưu", "Hệ thống lưu thành công, hiển thị 1.5")
add_tc("UC4.2", "Kiểm tra phân vùng tương đương (Negative)", "Nhập giá trị chữ cái vào hệ số", "Đã vào tab Hệ số ca", "Thứ 2: 'Một'", "1. Nhập chữ 'Một'\n2. Lưu", "Không cho phép nhập chữ hoặc báo lỗi định dạng", "Negative test")

# ==================== UC4.3: HỆ SỐ CA PHỨC TẠP ====================
add_tc("UC4.3", "Thêm độ khó bệnh nhân", "Lưu ca bệnh khó hệ số 0.5", "Đã vào tab Hệ số bệnh", "Tên: Mổ răng khôn mọc ngầm, Hệ số: 0.5", "1. Bấm Thêm\n2. Nhập dữ liệu\n3. Lưu", "Hệ thống thêm dòng mới vào danh sách với hệ số 0.5")

# ==================== UC4.4: LẬP PHIẾU LƯƠNG (CÔNG THỨC CHI TIẾT) ====================
base_salary = 100000
test_data = [
    ("Đại học", 1.3, "Giờ hành chính", 1.0, 4, "Thông thường", 0),
    ("Thạc sỹ", 1.5, "Giờ hành chính", 1.0, 4, "Khó vừa", 0.2),
    ("Giáo sư", 2.5, "Cuối tuần", 1.5, 4, "Rất khó", 0.5),
    ("Tiến sỹ", 1.7, "Ngoài giờ", 1.2, 2, "Thông thường", 0)
]

for doc, doc_coef, shift, shift_coef, hours, pat, pat_coef in test_data:
    converted = hours * (shift_coef + pat_coef)
    money = converted * doc_coef * base_salary
    
    desc = f"Kiểm tra công thức lương BS {doc}"
    precond = f"1. UC4.1 đã set lương cơ bản 100k\n2. Có ca trực {hours}h thực tế"
    inputs = f"BS: {doc} ({doc_coef})\nGiờ: {hours}\nHs Ca: {shift_coef}\nHs Bệnh: {pat_coef}"
    steps = "1. Mở Lập phiếu lương\n2. Chọn Bác sĩ và Tháng\n3. Kiểm tra bảng chi tiết ca trực hiển thị số liệu\n4. Đối chiếu tiền hệ thống tính ra"
    expected = f"Số giờ QĐ = {hours} * ({shift_coef} + {pat_coef}) = {converted}\nTiền ca = {converted} * {doc_coef} * 100.000 = {int(money)} VND.\nHệ thống phải hiển thị đúng {int(money)} VND."
    
    add_tc("UC4.4", f"Tính lương ca trực - {doc} - {shift}", desc, precond, inputs, steps, expected, "Integration test")

# Lỗi dữ liệu
add_tc("UC4.4", "Ca trực 0 giờ (Boundary)", "Hệ thống xử lý lỗi khi ca trực bị ghi nhận 0 giờ", "Có bản ghi ca trực bị lỗi 0 giờ do checkin/out sai", "Giờ: 0", "1. Lập phiếu lương\n2. Xem ca trực", "Tiền tính ra phải bằng 0 VND, không bị lỗi sập trang", "Boundary test")

# ==================== UC4.5, 4.6, 4.7: BÁO CÁO ====================
add_tc("UC4.5", "Tính nhất quán Báo cáo tháng", "Tổng quỹ tháng phải bằng tổng các phiếu lương con", "Đã chốt phiếu lương cho 3 BS", "Tháng hiện tại", "1. Xem báo cáo tháng\n2. Cộng tay cột tổng lương 3 BS", "Con số 'Tổng quỹ lương' dưới cùng phải khớp chính xác với phép cộng tay", "Integration test")
add_tc("UC4.6", "Báo cáo năm BS không có data", "Xem BS chưa từng làm việc", "Hệ thống có BS mới tạo tài khoản", "Năm 2026, BS mới", "1. Mở báo cáo cá nhân\n2. Chọn BS", "Hệ thống hiển thị biểu đồ rỗng (0 VND) tất cả 12 tháng, không báo lỗi code", "Negative test")

with open(output_path, mode='w', encoding='utf-8-sig', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['Test Case ID', 'Tên test case', 'Mô tả ngắn gọn', 'Điều kiện tiên quyết', 'Dữ liệu đầu vào', 'Các bước thực hiện', 'Kết quả mong đợi', 'Kết quả thực tế', 'Pass/Fail', 'Ghi chú'])
    for tc in test_cases:
        writer.writerow(tc)

print("Xong!")
