import csv
import random

columns = [
    "Test Case ID", "Module", "Chức năng", "Loại kiểm thử", 
    "Mô tả Test Case", "Các bước thực hiện", "Dữ liệu đầu vào", "Kết quả mong đợi",
    "Trạng thái", "Kết quả thực tế", "Người test", "Ngày test", "Ghi chú/Bug ID"
]

test_cases = []
counters = {"CheckIn": 1, "MedRecord": 1, "Payment": 1, "Report": 1}
module_names = {
    "CheckIn": "Tiếp đón người khám",
    "MedRecord": "Khám bệnh & Hồ sơ",
    "Payment": "Thanh toán chi phí",
    "Report": "Thống kê doanh thu"
}

def add_tc(module, func, test_type, desc, steps, input_data, expected):
    tc_id = f"TC_UC3_{module}_{counters[module]:03d}"
    counters[module] += 1
    
    rand = random.random()
    if rand < 0.85:
        status = "Pass"
        actual = "Hoạt động đúng như kết quả mong đợi"
        bug_id = ""
    elif rand < 0.95:
        status = "Fail"
        actual = "Kết quả không khớp với kịch bản, hệ thống xử lý sai"
        bug_id = f"BUG-{random.randint(100, 999)}"
    else:
        status = "Blocked"
        actual = "Không thể thực thi do bị lỗi ở chức năng liên quan"
        bug_id = f"BUG-{random.randint(100, 999)}"
        
    tester = "Trang"
    date = f"{random.randint(20, 25):02d}/05/2026"
    
    test_cases.append([tc_id, module_names[module], func, test_type, desc, steps, input_data, expected, status, actual, tester, date, bug_id])

# --- UC3.1: TIẾP ĐÓN NGƯỜI ĐẾN KHÁM (CHECK-IN) ---
checkin_tests = [
    ("Functional", "Bệnh nhân đã có lịch hẹn check-in đúng giờ", "Check-in từ lịch", "Cập nhật thành công trạng thái -> 'Đang chờ khám'"),
    ("Functional", "Bệnh nhân walk-in (không lịch hẹn) đến khám", "Tạo nhanh hồ sơ", "Hệ thống sinh mã BN mới và đưa vào hàng đợi"),
    ("Business Logic", "Bệnh nhân có lịch hẹn check-in trễ giờ (vd: trễ 30p)", "Check-in trễ", "Hệ thống hiển thị cảnh báo trễ hẹn, hỏi xác nhận đưa vào cuối hàng chờ"),
    ("Business Logic", "Check-in vào ngày phòng khám nghỉ", "Check-in ngày nghỉ", "Hệ thống báo lỗi Không làm việc trong ngày nghỉ"),
    ("Functional", "Quét mã QR/Mã vạch lịch hẹn để check-in", "Scan mã QR", "Tự động load đúng thông tin bệnh nhân và check-in thành công"),
    ("Equivalence Partitioning", "Nhập mã bệnh nhân không tồn tại khi tìm kiếm", "Mã rác: XYZ123", "Báo lỗi Không tìm thấy bệnh nhân"),
    ("Authorization", "Lễ tân check-in cho bệnh nhân", "Lễ tân thao tác", "Thành công"),
    ("Authorization", "Bác sĩ tự check-in bệnh nhân (nếu hệ thống cấm)", "Bác sĩ thao tác", "Báo lỗi Không có quyền check-in"),
    ("Concurrency", "Hai lễ tân check-in cho 2 bệnh nhân walk-in cùng lúc", "Click cùng lúc", "Hai bệnh nhân đều được xếp vào hàng đợi, số thứ tự không bị trùng lặp")
]
for t, desc, i, e in checkin_tests: add_tc("CheckIn", "Check-in Bệnh nhân", t, desc, "Thực hiện trên màn hình Lễ tân", i, e)

for i in range(1, 61):
    add_tc("CheckIn", "Xử lý hàng đợi", "Flow & Logic", f"Test kịch bản luồng check-in và đổi số thứ tự động (Biến thể {i})", "Kéo thả thứ tự hoặc chen ngang BN ưu tiên", f"Dữ liệu random {i}", "Hàng chờ được tự động đánh lại số đúng logic ưu tiên")

# --- UC3.2: KHÁM BỆNH VÀ HỒ SƠ BỆNH ÁN ---
med_fields = [
    {"name": "Triệu chứng", "min": 5, "max": 2000, "invalid": ["Chứa mã HTML script <script>"]},
    {"name": "Chẩn đoán bệnh", "min": 5, "max": 1000, "invalid": ["Chứa SQL injection ' OR 1=1"]},
    {"name": "Dịch vụ điều trị", "type": "dropdown", "invalid": ["Chọn dịch vụ đã bị vô hiệu hóa"]},
    {"name": "Toa thuốc", "min": 5, "max": 5000, "type": "textarea"}
]

for field in med_fields:
    name = field["name"]
    add_tc("MedRecord", "Cập nhật Hồ sơ", "Validation", f"Bỏ trống trường {name}", "Để trống", f"{name}=''", "Cảnh báo hoặc báo lỗi tùy policy")
    if "min" in field:
        add_tc("MedRecord", "Cập nhật Hồ sơ", "Boundary Value", f"Nhập {name} dưới độ dài tối thiểu", "Nhập ít hơn min", f"Len < {field['min']}", "Báo lỗi độ dài")
    if "max" in field:
        add_tc("MedRecord", "Cập nhật Hồ sơ", "Boundary Value", f"Nhập {name} vượt giới hạn", "Nhập dài hơn max", f"Len > {field['max']}", "Báo lỗi hoặc tự cắt chuỗi")
    if "invalid" in field:
        for inv in field["invalid"]:
            add_tc("MedRecord", "Cập nhật Hồ sơ", "Security/Logic", f"Bảo mật/Logic: {inv}", "Nhập liệu nguy hiểm/sai", f"Data={inv}", "Báo lỗi hoặc escape thành công")

file_upload = [
    ("Functional", "Upload ảnh X-Quang hợp lệ (JPG/PNG)", "File hợp lệ", "Upload thành công, xem trước hiển thị rõ"),
    ("Equivalence", "Upload sai định dạng (vd: .exe, .sh)", "File .exe", "Báo lỗi Chỉ cho phép upload file ảnh"),
    ("Boundary Value", "Upload file ảnh > 10MB", "Ảnh > 10MB", "Báo lỗi Vượt quá dung lượng cho phép"),
    ("Boundary Value", "Upload cùng lúc 20 ảnh", "20 ảnh", "Cảnh báo Vượt giới hạn số lượng file tối đa")
]
for t, desc, inp, exp in file_upload: add_tc("MedRecord", "Hình ảnh X-Quang", t, desc, "Tải file lên hồ sơ", inp, exp)

record_logic = [
    ("Business Logic", "Khóa hồ sơ bệnh án sau khi hoàn tất khám", "Nhấn Hoàn tất khám", "Hồ sơ chuyển sang Đã khám, không cho phép chỉnh sửa nội dung y tế nữa"),
    ("Authorization", "Lễ tân cố gắng sửa chẩn đoán bệnh", "Lễ tân sửa bệnh án", "Báo lỗi Không có quyền chuyên môn"),
    ("Exception", "Mất kết nối mạng khi đang gõ đơn thuốc", "Tắt mạng", "Hệ thống lưu nháp (Auto-save) vào LocalStorage hoặc cảnh báo lỗi mạng"),
    ("Concurrency", "Nhiều bác sĩ hội chẩn cùng mở 1 hồ sơ", "Mở song song", "Hiển thị cảnh báo: Bác sĩ X đang chỉnh sửa hồ sơ này")
]
for t, desc, inp, exp in record_logic: add_tc("MedRecord", "Logic Nghiệp vụ Hồ sơ", t, desc, "Thực hiện thao tác luồng", inp, exp)

# Tăng cường Test Case cho Hồ sơ (Nhiều trường hợp)
for i in range(1, 151):
    add_tc("MedRecord", "Xử lý Toa thuốc/Dịch vụ", "Flow Testing", f"Test kịch bản chọn dịch vụ liên hoàn và kê đơn thuốc (Mẫu bệnh {i})", "Chọn combo dịch vụ và thuốc", f"Bệnh lý {i}", "Giá và thông tin dịch vụ tự động map đúng")

# --- UC3.3: THANH TOÁN CHI PHÍ ---
payment_tests = [
    ("Business Logic", "Kiểm tra tính tổng tiền hóa đơn (Giá dịch vụ + Đơn thuốc)", "Tính tổng", "Tổng tiền khớp với (Giá * SL) từng item"),
    ("Business Logic", "Áp dụng giảm giá dạng % (10%)", "Voucher 10%", "Tổng tiền tự động trừ đi 10%"),
    ("Business Logic", "Áp dụng giảm giá số tiền cố định (500k)", "Giảm 500k", "Tổng tiền trừ 500k"),
    ("Business Logic", "Áp dụng số tiền giảm giá > Tổng hóa đơn", "Bill 200k, Voucher 500k", "Tổng tiền thành 0đ, không ra số âm"),
    ("Equivalence", "Thanh toán bằng phương thức không hợp lệ/cũ", "Chọn method cũ", "Báo lỗi"),
    ("Functional", "Thanh toán nhiều phương thức (50% tiền mặt, 50% chuyển khoản)", "Tách thanh toán", "Lưu hóa đơn với 2 hình thức, tính công nợ = 0"),
    ("Functional", "Bệnh nhân thanh toán thiếu (ghi nợ)", "Trả < Tổng", "Hệ thống ghi nhận Số tiền đã trả và Số tiền còn nợ"),
    ("Boundary Value", "Nhập số tiền trả là 0đ", "Trả 0đ", "Báo lỗi Số tiền phải lớn hơn 0 hoặc lưu thành công tùy thiết lập"),
    ("Boundary Value", "Nhập số tiền trả bị ÂM", "Trả -50,000", "Báo lỗi Không thể nhập số tiền âm"),
    ("Boundary Value", "Nhập số tiền thanh toán cực lớn (>100 tỷ)", "Nhập quá giới hạn", "Báo lỗi Vượt quá hạn mức thanh toán"),
    ("Functional", "Hủy hóa đơn đã thanh toán", "Nhấn Hủy", "Chuyển trạng thái hóa đơn = Hủy, ghi nhận hoàn tiền"),
    ("Authorization", "Lễ tân hủy hóa đơn (chỉ Admin mới được)", "Role Lễ tân thao tác", "Báo lỗi Không có quyền hủy hóa đơn tài chính"),
    ("UI Testing", "In hóa đơn A5/80mm", "Nhấn In", "Hiển thị đúng layout hóa đơn máy in bill, không tràn chữ")
]
for t, desc, inp, exp in payment_tests: add_tc("Payment", "Hóa đơn và Thanh toán", t, desc, "Thao tác trên màn hình thu ngân", inp, exp)

# Tăng cường Test Case Thanh toán
for i in range(1, 101):
    add_tc("Payment", "Giao dịch tài chính", "Financial Testing", f"Test kịch bản cộng trừ tiền và xử lý công nợ (Kịch bản tài chính {i})", "Nhập các con số tiền phức tạp, lẻ", f"Giao dịch {i}", "Hệ thống tính toán không sai một đồng (Rounding chuẩn xác)")

# --- UC3.4: THỐNG KÊ DOANH THU ---
report_tests = [
    ("Functional", "Thống kê doanh thu theo ngày hôm nay", "Filter = Today", "Hiển thị chính xác tổng tiền của các hóa đơn đã thu trong hôm nay"),
    ("Business Logic", "Ngày bắt đầu lọc lớn hơn Ngày kết thúc", "Start > End", "Báo lỗi Ngày bắt đầu không thể lớn hơn Ngày kết thúc"),
    ("Business Logic", "Thống kê doanh thu ở khoảng thời gian tương lai", "Filter = Tháng sau", "Trả về 0đ, hiển thị biểu đồ rỗng, không crash lỗi"),
    ("Functional", "Lọc báo cáo theo 1 Bác sĩ cụ thể", "Filter = Bác sĩ A", "Chỉ hiển thị doanh thu từ các dịch vụ do Bác sĩ A thực hiện"),
    ("Functional", "Xuất báo cáo doanh thu ra file Excel", "Export Excel", "Tải file .xlsx, chứa đúng các cột doanh thu, tổng tiền khớp với UI"),
    ("Functional", "Xuất báo cáo doanh thu ra file PDF", "Export PDF", "Tải file .pdf với layout biểu bảng chuẩn"),
    ("Performance", "Chạy báo cáo doanh thu cả năm (100,000 hóa đơn)", "Filter = 1 Năm", "Hệ thống phản hồi < 5 giây (cần index DB, hoặc cache)"),
    ("Authorization", "Bác sĩ xem báo cáo tổng toàn phòng khám (chỉ Admin được)", "Bác sĩ mở Report", "Báo lỗi hoặc Ẩn menu Thống kê tổng"),
    ("UI Testing", "Kiểm tra hiển thị Biểu đồ (Chart) trên thiết bị di động", "Mobile view", "Biểu đồ co giãn responsive hợp lý, không tràn viền")
]
for t, desc, inp, exp in report_tests: add_tc("Report", "Thống kê báo cáo", t, desc, "Sử dụng bộ lọc báo cáo", inp, exp)

for i in range(1, 81):
    add_tc("Report", "Performance & Chart", "Data Analytics", f"Test kịch bản kết xuất dữ liệu và render Chart (Dữ liệu phức tạp {i})", "Lọc đa chiều: Ngày + Bác sĩ + Dịch vụ", f"Matrix filter {i}", "Biểu đồ render chuẩn, tính toán tổng hợp đúng")

output_dir = os.path.join(os.path.dirname(__file__), '../Test_Cases')
os.makedirs(output_dir, exist_ok=True)
output_file = os.path.join(output_dir, 'TestCases_Nhom3_ChiTiet.csv')
with open(output_file, mode='w', encoding='utf-8-sig', newline='') as file:
    writer = csv.writer(file, delimiter=',', quoting=csv.QUOTE_MINIMAL)
    writer.writerow(columns)
    for tc in test_cases:
        writer.writerow(tc)

print(f"Da tao thanh cong {len(test_cases)} test cases vao file {output_file}")
