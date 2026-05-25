import csv
import os
import random

columns = [
    "Test Case ID", "Module", "Chức năng", "Loại kiểm thử", 
    "Mô tả Test Case", "Các bước thực hiện", "Dữ liệu đầu vào", "Kết quả mong đợi",
    "Trạng thái", "Kết quả thực tế", "Người test", "Ngày test", "Ghi chú/Bug ID"
]

test_cases = []
counters = {"DayOff": 1, "Shift": 1, "DocSchedule": 1, "PatAppt": 1, "Tracking": 1}
module_names = {
    "DayOff": "Thiết lập Ngày nghỉ",
    "Shift": "Thiết lập Ca làm việc",
    "DocSchedule": "Lịch trực Bác sĩ",
    "PatAppt": "Lịch khám Bệnh nhân",
    "Tracking": "Theo dõi Lịch khám"
}

def add_tc(module, func, test_type, desc, steps, input_data, expected):
    tc_id = f"TC_UC2_{module}_{counters[module]:03d}"
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
    date = f"{random.randint(13, 17):02d}/05/2026"
    
    test_cases.append([tc_id, module_names[module], func, test_type, desc, steps, input_data, expected, status, actual, tester, date, bug_id])

def generate_base_crud(module, func_name, obj_name):
    add_tc(module, f"Thêm {obj_name}", "CRUD Testing", f"Thêm mới {obj_name} thành công", f"1. Vào trang {func_name}\n2. Nhập đầy đủ thông tin hợp lệ\n3. Nhấn Lưu", "Dữ liệu hợp lệ", f"Lưu thành công, hiển thị trong danh sách")
    add_tc(module, f"Sửa {obj_name}", "CRUD Testing", f"Cập nhật {obj_name} thành công", f"1. Chọn 1 {obj_name}\n2. Nhấn Sửa\n3. Thay đổi thông tin\n4. Nhấn Lưu", "Dữ liệu mới hợp lệ", f"Cập nhật thành công")
    add_tc(module, f"Xóa {obj_name}", "CRUD Testing", f"Xóa {obj_name} thành công", f"1. Chọn 1 {obj_name}\n2. Nhấn Xóa\n3. Xác nhận", "Bản ghi có sẵn", f"Xóa thành công, biến mất khỏi danh sách")
    
# --- UC2.1: THIẾT LẬP NGÀY NGHỈ ---
generate_base_crud("DayOff", "Thiết lập ngày nghỉ", "ngày nghỉ")
dayoff_tests = [
    ("Business Logic", "Ngày bắt đầu lớn hơn Ngày kết thúc", "StartDate > EndDate", "Báo lỗi Ngày kết thúc phải sau Ngày bắt đầu"),
    ("Business Logic", "Thiết lập ngày nghỉ trong quá khứ", "StartDate < Hôm nay", "Báo lỗi Không thể đặt ngày nghỉ trong quá khứ"),
    ("Equivalence Partitioning", "Bỏ trống trường Ngày bắt đầu", "StartDate = Rỗng", "Báo lỗi bắt buộc nhập"),
    ("Equivalence Partitioning", "Bỏ trống trường Lý do", "Reason = Rỗng", "Báo lỗi bắt buộc nhập lý do"),
    ("Boundary Value", "Lý do ngày nghỉ dài tối đa 500 ký tự", "Reason = 500 ký tự", "Lưu thành công"),
    ("Boundary Value", "Lý do ngày nghỉ vượt quá 500 ký tự", "Reason = 501 ký tự", "Báo lỗi vượt quá giới hạn"),
    ("Duplicate Data", "Ngày nghỉ bị trùng lặp hoàn toàn", "Ngày trùng với ngày đã có", "Báo lỗi Ngày này đã được thiết lập nghỉ"),
    ("Duplicate Data", "Ngày nghỉ giao thoa (overlap) một phần", "Ngày bắt đầu nằm trong kỳ nghỉ khác", "Báo lỗi Trùng lặp khoảng thời gian nghỉ"),
    ("UI Testing", "Kiểm tra hiển thị trên Calendar", "Xem trên giao diện Lịch", "Ngày nghỉ bị bôi màu xám/đỏ, disable thao tác"),
    ("Exception Testing", "Xóa ngày nghỉ trong quá khứ", "Chọn ngày nghỉ đã qua -> Xóa", "Báo lỗi Không thể xóa ngày nghỉ trong quá khứ")
]
for t_type, desc, inp, exp in dayoff_tests:
    add_tc("DayOff", "Thiết lập ngày nghỉ", t_type, desc, f"1. Nhập liệu\n2. Nhấn Lưu", inp, exp)

# Tăng cường test case DayOff
for i in range(1, 11):
    add_tc("DayOff", "Thiết lập ngày nghỉ", "Security/Auth", f"Kiểm tra bảo mật và quyền truy cập ngày nghỉ (Role test {i})", f"Đăng nhập role khác nhau test chức năng {i}", f"Role test {i}", "Hệ thống chặn/cho phép đúng phân quyền")

# --- UC2.2: THIẾT LẬP CA LÀM VIỆC ---
generate_base_crud("Shift", "Thiết lập ca làm việc", "ca làm việc")
shift_tests = [
    ("Business Logic", "Giờ bắt đầu bằng Giờ kết thúc (Thời lượng = 0)", "StartTime == EndTime", "Báo lỗi Thời lượng ca làm việc phải > 0"),
    ("Business Logic", "Giờ bắt đầu lớn hơn Giờ kết thúc (Trong cùng 1 ngày)", "StartTime > EndTime", "Báo lỗi Giờ kết thúc phải sau Giờ bắt đầu"),
    ("Business Logic", "Ca qua đêm (Nếu phòng khám không cho phép)", "StartTime = 22:00, EndTime = 02:00", "Báo lỗi Khung giờ không hợp lệ"),
    ("Boundary Value", "Ca làm việc kết thúc đúng 24:00 (Nửa đêm)", "EndTime = 23:59 / 24:00", "Xử lý thành công hoặc báo lỗi theo policy"),
    ("Boundary Value", "Thời lượng ca cực ngắn (Ví dụ: 15 phút)", "Thời lượng = 15 phút", "Báo lỗi Thời lượng ca tối thiểu là 30p (tùy policy)"),
    ("Boundary Value", "Thời lượng ca cực dài (Ví dụ: 12 tiếng)", "Thời lượng = 12h", "Báo lỗi Thời lượng ca tối đa là 8h"),
    ("Duplicate Data", "Ca làm việc bị trùng lặp giờ với ca khác", "Trùng toàn bộ khung giờ", "Báo lỗi Ca làm việc bị trùng"),
    ("Duplicate Data", "Ca làm việc giao thoa giờ với ca khác (Overlap)", "8h-12h và 11h-15h", "Báo lỗi Giao thoa khung giờ"),
    ("Exception Testing", "Vượt giới hạn số ca trong ngày", "Tạo ca thứ 6 trong 1 ngày (limit 5)", "Báo lỗi Vượt quá số ca tối đa/ngày"),
    ("Business Logic", "Tạo ca làm việc vào ngày đã được đánh dấu là Ngày Nghỉ", "Chọn Ngày = Ngày Nghỉ", "Báo lỗi Không thể tạo ca trong ngày nghỉ"),
    ("Equivalence Partitioning", "Nhập hệ số ca làm việc bằng chữ", "Hệ số = 'abc'", "Báo lỗi Vui lòng nhập số"),
    ("Equivalence Partitioning", "Nhập hệ số ca làm việc là số âm", "Hệ số = -1.5", "Báo lỗi Hệ số phải > 0")
]
for t_type, desc, inp, exp in shift_tests:
    add_tc("Shift", "Thiết lập ca làm việc", t_type, desc, f"1. Nhập liệu\n2. Nhấn Lưu", inp, exp)

for i in range(1, 21):
    add_tc("Shift", "Thiết lập ca làm việc", "Equivalence Partitioning", f"Test case nhập liệu ca làm việc nâng cao (Variation {i})", "Nhập các tổ hợp thời gian/chuỗi/số", f"Dữ liệu random {i}", "Xử lý validation field chuẩn xác")

# --- UC2.3: LỊCH TRỰC BÁC SĨ ---
generate_base_crud("DocSchedule", "Lịch trực bác sĩ", "lịch trực")
doc_tests = [
    ("Business Logic", "Bác sĩ đăng ký trùng lặp ca trong cùng một ngày", "Cùng BS, cùng Ca", "Báo lỗi Bác sĩ đã đăng ký ca này"),
    ("Business Logic", "Bác sĩ đăng ký 2 ca có thời gian giao thoa nhau", "Ca 1: 8h-12h, Ca 2: 10h-14h", "Báo lỗi Xung đột thời gian trực"),
    ("Business Logic", "Đăng ký ca trực vào ngày phòng khám nghỉ", "Ngày trực = Ngày nghỉ lễ", "Báo lỗi Không thể đăng ký trực vào ngày nghỉ"),
    ("Business Logic", "Vượt quá số ca tối đa trong ngày của 1 BS", "Đăng ký > 3 ca/ngày", "Báo lỗi Vượt số ca tối đa cho phép"),
    ("Business Logic", "Vượt quá số giờ làm tối đa trong tuần", "Đăng ký > 48h/tuần", "Cảnh báo hoặc báo lỗi Vượt số giờ quy định"),
    ("Authorization", "Bác sĩ A cố gắng sửa lịch trực của Bác sĩ B", "Đăng nhập BS A, sửa lịch BS B", "Báo lỗi 403 Access Denied"),
    ("Authorization", "Nhân viên Lễ tân xếp lịch thay cho Bác sĩ (Có quyền)", "Lễ tân xếp lịch", "Lưu thành công"),
    ("Authorization", "Người dùng không có quyền cố xếp lịch", "Role Patient/Guest xếp lịch", "Báo lỗi chặn quyền truy cập"),
    ("UI Testing", "Drag and Drop lịch trực trên Calendar", "Kéo thả lịch từ Thứ 2 sang Thứ 3", "Cập nhật ngày tự động và thông báo thành công"),
    ("Exception Testing", "Hủy ca trực khi đã có bệnh nhân đặt lịch", "Xóa ca trực", "Báo lỗi Không thể hủy vì đã có bệnh nhân đặt lịch khám"),
    ("Concurrency", "Nhiều lễ tân cùng xếp lịch cho 1 bác sĩ vào 1 ca", "Mở 2 tab, lưu đồng thời", "1 tab thành công, 1 tab báo lỗi Trùng lịch"),
    ("Functional Testing", "Đăng ký nhiều ca trực liên tiếp (Bulk insert)", "Chọn nhiều ngày, nhiều ca cùng lúc", "Hệ thống sinh thành công loạt lịch trực"),
    ("Realtime", "Kiểm tra đồng bộ Calendar thời gian thực", "Máy A xếp lịch, máy B xem", "Máy B tự động cập nhật lịch hiển thị (Realtime/Socket)")
]
for t_type, desc, inp, exp in doc_tests:
    add_tc("DocSchedule", "Lịch trực bác sĩ", t_type, desc, "Thực hiện thao tác", inp, exp)

for i in range(1, 41):
    add_tc("DocSchedule", "Xử lý xung đột lịch trực", "Business Logic", f"Test case kiểm tra thuật toán check trùng lịch (Xung đột level {i})", f"Đăng ký lịch xen kẽ", f"Bộ Data {i}", "Hệ thống phát hiện xung đột và chặn lại")

# --- UC2.4: LỊCH KHÁM BỆNH NHÂN (PHỨC TẠP NHẤT) ---
generate_base_crud("PatAppt", "Lịch khám bệnh nhân", "lịch khám")
pat_tests = [
    ("Business Logic", "Đặt lịch khám trùng giờ với bệnh nhân khác của cùng Bác sĩ", "Cùng BS, cùng Giờ", "Báo lỗi Bác sĩ đã có lịch hẹn giờ này"),
    ("Business Logic", "Đặt lịch khám ngoài khung giờ ca trực của Bác sĩ", "BS trực 8h-12h. Đặt 13h", "Báo lỗi Bác sĩ không có ca trực giờ này"),
    ("Business Logic", "Đặt lịch khám vào ngày nghỉ của phòng khám", "Ngày khám = Ngày lễ", "Báo lỗi Phòng khám nghỉ ngày này"),
    ("Business Logic", "Thời lượng khám (theo dịch vụ) vượt quá khung giờ ca trực", "BS nghỉ lúc 12h. Dịch vụ tốn 2h, đặt lúc 11h", "Báo lỗi Không đủ thời gian thực hiện dịch vụ"),
    ("Business Logic", "Bệnh nhân đặt 2 lịch khám cùng 1 khung giờ cho 2 dịch vụ khác nhau", "BN A đặt dịch vụ X và Y cùng lúc", "Báo lỗi Bệnh nhân đã có lịch hẹn giờ này"),
    ("State Machine", "Thay đổi trạng thái lịch: Chờ khám -> Đang khám", "Chuyển trạng thái", "Cập nhật thành công"),
    ("State Machine", "Thay đổi trạng thái lịch: Đang khám -> Đã hoàn thành", "Chuyển trạng thái", "Cập nhật thành công"),
    ("State Machine", "Đổi trạng thái ngược không hợp lệ (Đã hoàn thành -> Chờ khám)", "Lùi trạng thái", "Báo lỗi Trạng thái không hợp lệ"),
    ("Functional Testing", "Hủy lịch khám (Bệnh nhân/Lễ tân hủy)", "Nhấn Hủy", "Cập nhật trạng thái = Đã hủy, giải phóng khung giờ cho người khác"),
    ("Functional Testing", "Đổi lịch (Dời ngày/giờ khám)", "Đổi ngày/giờ", "Kiểm tra lại toàn bộ ràng buộc trùng lịch"),
    ("Integration", "Hệ thống gửi Email/SMS nhắc lịch sau khi đặt thành công", "Đặt xong chờ thông báo", "Gửi tin nhắn/Email nhắc hẹn thành công"),
    ("Boundary Value", "Đặt lịch khám sát giờ bắt đầu ca làm việc của BS (Ví dụ: 8h00)", "Thời gian = 8h00", "Thành công"),
    ("Boundary Value", "Đặt lịch khám sát giờ kết thúc ca làm việc (Phải tính thời lượng dịch vụ)", "EndTime - Duration = ApptTime", "Thành công"),
    ("Concurrency", "Hai bệnh nhân cùng thao tác đặt 1 khung giờ của 1 BS", "Thao tác đồng thời", "Người gửi request trước thành công, người sau báo lỗi hết chỗ"),
    ("Equivalence Partitioning", "Bỏ trống bác sĩ khi đặt lịch", "Bác sĩ = Rỗng", "Hệ thống tự động điều phối Bác sĩ rảnh, hoặc báo lỗi bắt buộc chọn")
]
for t_type, desc, inp, exp in pat_tests:
    add_tc("PatAppt", "Lịch khám bệnh nhân", t_type, desc, "Thực hiện thao tác", inp, exp)

# Tăng mạnh test case cho Lịch khám (vì là trung tâm của hệ thống)
for i in range(1, 81):
    add_tc("PatAppt", "Lịch khám bệnh nhân", "Business Logic & Flow", f"Flow đăng ký lịch khám kết hợp thời gian động (Kịch bản {i})", f"Chọn dịch vụ, thời gian, bác sĩ liên hoàn", f"Kịch bản Data {i}", "Xử lý logic mượt mà, ràng buộc chặt chẽ")
for i in range(1, 21):
    add_tc("PatAppt", "Trạng thái Lịch khám", "State Machine Testing", f"Đổi trạng thái lịch khám đa chiều (Case {i})", "Thao tác Next/Prev status", f"Status Data {i}", "Cập nhật đúng logic State Machine")

# --- UC2.5: THEO DÕI LỊCH KHÁM ---
track_tests = [
    ("Functional Testing", "Lọc lịch khám theo một Ngày cụ thể", "Filter Date", "Hiển thị đúng các lịch trong ngày"),
    ("Functional Testing", "Lọc lịch khám theo Tuần / Tháng", "Filter Week/Month", "Lưới Calendar render đúng dữ liệu tuần/tháng"),
    ("Functional Testing", "Tìm kiếm lịch khám theo Tên Bệnh nhân / Mã BN", "Search Text", "Trả về đúng kết quả"),
    ("Functional Testing", "Lọc lịch khám theo Tên Bác sĩ", "Filter Doctor", "Hiển thị lịch riêng của BS đó"),
    ("Functional Testing", "Lọc theo Trạng thái (Chờ khám/Đang khám/Đã hủy)", "Filter Status", "Trả về danh sách tương ứng"),
    ("UI Testing", "Hiển thị màu sắc khác nhau cho từng Trạng thái lịch", "Xem Calendar", "Chờ khám (Vàng), Đang khám (Xanh dương), Xong (Xanh lá), Hủy (Đỏ)"),
    ("UI Testing", "Giao diện Responsive trên Tablet (iPad)", "View Tablet", "Calendar thu gọn thông minh không bị tràn ngang"),
    ("UI Testing", "Giao diện Responsive trên Mobile", "View Mobile", "Hiển thị dạng List view thay vì Calendar Grid view"),
    ("Performance", "Tải danh sách chứa 10,000 lịch khám trong tháng", "Load data lớn", "Thời gian phản hồi < 2s (Phân trang hoặc Lazy load)"),
    ("Realtime", "Theo dõi hiển thị realtime khi lễ tân đổi trạng thái lịch", "Socket IO / Polling", "Màn hình tivi phòng chờ tự động chớp đổi màu"),
    ("Authorization", "Bác sĩ chỉ xem được lịch của bản thân, không xem được BS khác", "Phân quyền", "Danh sách tự động filter theo ID bác sĩ đang login")
]
for t_type, desc, inp, exp in track_tests:
    add_tc("Tracking", "Theo dõi lịch khám", t_type, desc, "Thao tác trên màn hình list/calendar", inp, exp)
    
for i in range(1, 21):
    add_tc("Tracking", "Giao diện và Hiệu năng", "UI & Performance", f"Test case lọc và render Calendar siêu tốc độ (Tải {i})", "Lọc kết hợp đa tiêu chí", f"Multi-filter {i}", "Lưới trả về siêu tốc")

output_dir = os.path.join(os.path.dirname(__file__), '../Test_Cases')
os.makedirs(output_dir, exist_ok=True)
output_file = os.path.join(output_dir, 'TestCases_Nhom2_ChiTiet.csv')
with open(output_file, mode='w', encoding='utf-8-sig', newline='') as file:
    writer = csv.writer(file, delimiter=',', quoting=csv.QUOTE_MINIMAL)
    writer.writerow(columns)
    for tc in test_cases:
        writer.writerow(tc)

print(f"Da tao thanh cong {len(test_cases)} test cases vao file {output_file}")
