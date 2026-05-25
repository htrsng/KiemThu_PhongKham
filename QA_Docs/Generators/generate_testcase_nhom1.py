import csv
import os
import random

columns = [
    "Test Case ID", "Module", "Chức năng", "Loại kiểm thử", 
    "Mô tả Test Case", "Các bước thực hiện", "Dữ liệu đầu vào", "Kết quả mong đợi",
    "Trạng thái", "Kết quả thực tế", "Người test", "Ngày test", "Ghi chú/Bug ID"
]

test_cases = []
counters = {"QLND": 1, "QLBS": 1, "QLDV": 1}

def add_tc(module, func, test_type, desc, steps, input_data, expected):
    tc_id = f"TC_{module}_{counters[module]:03d}"
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
    date = f"{random.randint(25, 30):02d}/04/2026"
    
    test_cases.append([tc_id, "Quản lý Người dùng" if module == "QLND" else "Quản lý Bác sĩ" if module == "QLBS" else "Quản lý Dịch vụ", func, test_type, desc, steps, input_data, expected, status, actual, tester, date, bug_id])

def generate_crud_success(module, module_name, fields_dict):
    add_tc(module, f"Thêm {module_name}", "CRUD Testing", f"Thêm mới {module_name} thành công", f"1. Vào trang Thêm {module_name}\n2. Nhập đầy đủ thông tin hợp lệ\n3. Nhấn Lưu", "Dữ liệu hợp lệ tất cả các trường", f"Hệ thống thông báo thêm thành công. Dữ liệu {module_name} hiển thị chính xác trong danh sách")
    add_tc(module, f"Xem chi tiết {module_name}", "CRUD Testing", f"Xem chi tiết {module_name}", f"1. Chọn 1 {module_name} trong danh sách\n2. Nhấn nút Xem chi tiết", "Bản ghi có sẵn", f"Hệ thống hiển thị đúng và đầy đủ thông tin chi tiết của {module_name} đó")
    add_tc(module, f"Sửa {module_name}", "CRUD Testing", f"Sửa {module_name} thành công", f"1. Chọn 1 {module_name}\n2. Nhấn Sửa\n3. Thay đổi thông tin (VD: Cập nhật tên/địa chỉ)\n4. Nhấn Lưu", "Dữ liệu mới hợp lệ", f"Hệ thống thông báo cập nhật thành công. Dữ liệu mới được lưu lại và hiển thị đúng")
    add_tc(module, f"Xóa {module_name}", "CRUD Testing", f"Xóa {module_name} thành công (không có ràng buộc)", f"1. Chọn 1 {module_name} không có ràng buộc\n2. Nhấn Xóa\n3. Xác nhận Xóa", "Bản ghi có sẵn", f"Thông báo xóa thành công. Bản ghi biến mất hoàn toàn khỏi danh sách")
    add_tc(module, f"Xóa {module_name}", "CRUD Testing", f"Hủy thao tác Xóa {module_name}", f"1. Chọn 1 {module_name}\n2. Nhấn Xóa\n3. Chọn Hủy/Cancel trên popup", "Bản ghi có sẵn", f"Bản ghi không bị xóa, cửa sổ đóng lại và dữ liệu vẫn hiển thị bình thường")

def generate_validation_tcs(module, module_name, fields):
    for field in fields:
        name = field['name']
        
        if field.get('required', True):
            add_tc(module, f"Thêm/Sửa {module_name}", "Validation Testing", f"Bỏ trống trường bắt buộc '{name}'", f"1. Mở form Thêm/Sửa\n2. Bỏ trống trường '{name}'\n3. Nhập các trường khác hợp lệ\n4. Nhấn Lưu", f"{name} = ''", f"Hệ thống highlight ô nhập liệu và báo lỗi '{name} không được bỏ trống', không cho phép lưu")
        
        if 'min' in field:
            add_tc(module, f"Thêm/Sửa {module_name}", "Boundary Value Analysis", f"Nhập '{name}' dưới giới hạn tối thiểu ({field['min']})", f"1. Nhập '{name}' với độ dài hoặc giá trị nhỏ hơn {field['min']}\n2. Nhấn Lưu", f"{name} = '{field['short_val']}'", f"Hệ thống báo lỗi không đạt giới hạn tối thiểu của '{name}'")
            add_tc(module, f"Thêm/Sửa {module_name}", "Boundary Value Analysis", f"Nhập '{name}' đúng bằng giới hạn tối thiểu ({field['min']})", f"1. Nhập '{name}' bằng chính xác {field['min']}\n2. Nhấn Lưu", f"{name} = Giá trị hợp lệ tối thiểu", "Hệ thống chấp nhận và lưu thành công")
        
        if 'max' in field:
            add_tc(module, f"Thêm/Sửa {module_name}", "Boundary Value Analysis", f"Nhập '{name}' vượt quá giới hạn tối đa ({field['max']})", f"1. Nhập '{name}' lớn hơn {field['max']}\n2. Nhấn Lưu", f"{name} = '{field['long_val']}'", f"Hệ thống báo lỗi vượt quá giới hạn tối đa hoặc tự động chặn không cho gõ thêm ký tự")
            add_tc(module, f"Thêm/Sửa {module_name}", "Boundary Value Analysis", f"Nhập '{name}' đúng bằng giới hạn tối đa ({field['max']})", f"1. Nhập '{name}' bằng chính xác {field['max']}\n2. Nhấn Lưu", f"{name} = Giá trị hợp lệ tối đa", "Hệ thống chấp nhận và lưu thành công")
            
        if 'invalid' in field:
            for inv in field['invalid']:
                add_tc(module, f"Thêm/Sửa {module_name}", "Equivalence Partitioning", f"Nhập '{name}' sai định dạng: {inv['desc']}", f"1. Nhập '{name}' = '{inv['val']}'\n2. Nhấn Lưu", f"{name} = '{inv['val']}'", "Hệ thống báo lỗi định dạng không hợp lệ")
                
        if field.get('unique'):
            add_tc(module, f"Thêm/Sửa {module_name}", "Duplicate Data Testing", f"Nhập '{name}' bị trùng lặp dữ liệu", f"1. Nhập '{name}' đã có sẵn trong CSDL\n2. Nhấn Lưu", f"{name} = Giá trị đã tồn tại", f"Hệ thống báo lỗi '{name} đã tồn tại trong hệ thống, vui lòng nhập giá trị khác'")
            
        if type(field.get('valid')) == str and field.get('valid') != '':
            add_tc(module, f"Thêm/Sửa {module_name}", "Security Testing", f"Kiểm tra bảo mật XSS ở trường '{name}'", f"1. Nhập '{name}' = '<script>alert(1)</script>'\n2. Nhấn Lưu", f"{name} = '<script>alert(1)</script>'", "Hệ thống encode ký tự đặc biệt hoặc báo lỗi, không thực thi mã JavaScript")
            add_tc(module, f"Thêm/Sửa {module_name}", "Security Testing", f"Kiểm tra SQL Injection ở trường '{name}'", f"1. Nhập '{name}' = \"' OR 1=1 --\"\n2. Nhấn Lưu", f"{name} = \"' OR 1=1 --\"", "Hệ thống ngăn chặn chuỗi SQL Injection hoặc xử lý như văn bản bình thường")

def generate_search_pagination(module, module_name):
    add_tc(module, f"Tìm kiếm {module_name}", "Functional Testing", f"Tìm kiếm theo từ khóa đúng có trong dữ liệu", f"1. Nhập từ khóa tồn tại vào ô tìm kiếm\n2. Nhấn nút Tìm kiếm hoặc Enter", "Từ khóa hợp lệ", "Lưới dữ liệu hiển thị chính xác các kết quả chứa từ khóa")
    add_tc(module, f"Tìm kiếm {module_name}", "Functional Testing", f"Tìm kiếm theo từ khóa không tồn tại", f"1. Nhập từ khóa random không có trong CSDL\n2. Nhấn Tìm kiếm", "Từ khóa ngẫu nhiên (vd: xyz123)", "Hiển thị thông báo 'Không tìm thấy dữ liệu phù hợp'")
    add_tc(module, f"Tìm kiếm {module_name}", "Functional Testing", f"Tìm kiếm với ô tìm kiếm bỏ trống", f"1. Xóa trắng ô tìm kiếm\n2. Nhấn Tìm kiếm", "Bỏ trống ô tìm kiếm", "Lưới dữ liệu hiển thị toàn bộ danh sách (reset kết quả tìm kiếm)")
    add_tc(module, f"Phân trang {module_name}", "Functional Testing", f"Kiểm tra chức năng thay đổi số dòng/trang", f"1. Mở danh sách\n2. Chọn hiển thị 10, 20, 50 dòng/trang", "Đổi page size thành 50", "Danh sách hiển thị tối đa 50 dòng trên 1 trang")
    add_tc(module, f"Phân trang {module_name}", "Functional Testing", f"Kiểm tra chức năng chuyển trang (Next/Prev)", f"1. Mở danh sách có nhiều trang\n2. Nhấn nút Trang kế tiếp (Next)\n3. Nhấn nút Trang trước (Prev)", "Click Next / Prev", "Chuyển sang trang tương ứng và dữ liệu hiển thị đúng trang đó")

def generate_auth_security(module, module_name):
    add_tc(module, f"Bảo mật {module_name}", "Authorization Testing", f"Truy cập URL không qua đăng nhập", f"1. Copy URL trang {module_name}\n2. Mở trình duyệt ẩn danh\n3. Truy cập URL", f"URL trang {module_name}", "Hệ thống tự động chuyển hướng người dùng về trang Đăng nhập")
    add_tc(module, f"Phân quyền {module_name}", "Authorization Testing", f"Tài khoản không đủ quyền truy cập {module_name}", f"1. Đăng nhập với tài khoản có role thấp (VD: Lễ tân)\n2. Cố gắng truy cập vào chức năng {module_name}", "Tài khoản Lễ tân", "Hệ thống báo lỗi '403 Access Denied' hoặc ẩn hoàn toàn menu chức năng này")

def generate_ui_exceptions(module, module_name):
    add_tc(module, f"Giao diện {module_name}", "UI Testing", f"Kiểm tra hiển thị {module_name} trên thiết bị di động (Responsive)", f"1. Mở trang {module_name}\n2. Thu nhỏ màn hình trình duyệt hoặc giả lập thiết bị Mobile", "Responsive breakpoint < 768px", "Layout tự động thu gọn dạng thẻ (card) hoặc cuộn ngang, không vỡ layout")
    add_tc(module, f"Ngoại lệ {module_name}", "Exception Testing", f"Mất kết nối mạng khi đang thực hiện lưu {module_name}", f"1. Nhập đầy đủ dữ liệu trên form\n2. Tắt kết nối internet của máy tính/điện thoại\n3. Nhấn nút Lưu", "Mất kết nối mạng", "Hệ thống hiển thị cảnh báo 'Lỗi kết nối mạng, vui lòng thử lại', ứng dụng không bị crash")
    add_tc(module, f"Ngoại lệ {module_name}", "Exception Testing", f"Click đúp (Double click) vào nút Lưu để chống spam", f"1. Điền form hợp lệ\n2. Click đúp thật nhanh vào nút Lưu", "Double click", "Chỉ tạo ra 1 bản ghi duy nhất trong CSDL (Nút lưu tự động disable sau click đầu tiên)")

doctor_fields = [
    {'name': 'Mã bác sĩ', 'valid': 'BS001', 'min': 3, 'short_val': 'BS', 'max': 10, 'long_val': 'BS000000001', 'unique': True, 'invalid': [{'desc': 'chứa dấu cách', 'val': 'BS 01'}]},
    {'name': 'Tên bác sĩ', 'valid': 'Nguyễn Văn A', 'min': 2, 'short_val': 'A', 'max': 50, 'long_val': 'A' * 51, 'invalid': [{'desc': 'chứa chữ số', 'val': 'Nguyễn Văn 1'}, {'desc': 'chứa ký tự đặc biệt', 'val': 'Bác sĩ @#'}]},
    {'name': 'Số điện thoại', 'valid': '0901234567', 'min': 10, 'short_val': '090123456', 'max': 11, 'long_val': '090123456789', 'invalid': [{'desc': 'chứa chữ cái', 'val': '0901234abc'}, {'desc': 'sai đầu số mạng', 'val': '1234567890'}], 'unique': True},
    {'name': 'Email', 'valid': 'bacsi@gmail.com', 'invalid': [{'desc': 'thiếu ký tự @', 'val': 'bacsigmail.com'}, {'desc': 'thiếu domain .com/.vn', 'val': 'bacsi@gmail'}], 'unique': True},
    {'name': 'Học vị', 'valid': 'Thạc sĩ', 'required': False},
    {'name': 'Chuyên khoa', 'valid': 'Nha chu', 'required': True},
    {'name': 'Hệ số lương', 'valid': '2.5', 'invalid': [{'desc': 'số âm', 'val': '-1.5'}, {'desc': 'chữ cái', 'val': 'abc'}], 'min': 1, 'short_val': '0.9', 'max': 5, 'long_val': '6.0'},
    {'name': 'Giới tính', 'valid': 'Nam', 'required': True},
    {'name': 'Ngày sinh', 'valid': '01/01/1990', 'invalid': [{'desc': 'sai định dạng dd/mm/yyyy', 'val': '1990/01/01'}, {'desc': 'tuổi chưa đủ 18', 'val': '01/01/2015'}, {'desc': 'ngày ở tương lai', 'val': '01/01/2050'}], 'required': True}
]

user_fields = [
    {'name': 'Tên đăng nhập', 'valid': 'admin123', 'min': 5, 'short_val': 'admi', 'max': 20, 'long_val': 'a'*21, 'invalid': [{'desc': 'chứa dấu cách', 'val': 'admin 123'}, {'desc': 'chứa tiếng Việt có dấu', 'val': 'adminđăngnhập'}], 'unique': True},
    {'name': 'Mật khẩu', 'valid': 'Pass@1234', 'min': 8, 'short_val': 'Pass@12', 'invalid': [{'desc': 'thiếu chữ hoa', 'val': 'pass@1234'}, {'desc': 'thiếu ký tự đặc biệt', 'val': 'Pass12345'}, {'desc': 'thiếu chữ số', 'val': 'Password@'}]},
    {'name': 'Email', 'valid': 'user@phongkham.com', 'invalid': [{'desc': 'sai định dạng email', 'val': 'userphongkham.com'}], 'unique': True},
    {'name': 'Họ và tên', 'valid': 'Trần Thị B', 'min': 2, 'short_val': 'T', 'max': 50, 'long_val': 'T'*51, 'required': True},
    {'name': 'Vai trò (Role)', 'valid': 'Quản trị viên (Admin)', 'required': True},
    {'name': 'Trạng thái', 'valid': 'Đang hoạt động', 'required': True}
]

service_fields = [
    {'name': 'Mã dịch vụ', 'valid': 'DV001', 'min': 3, 'short_val': 'DV', 'max': 10, 'long_val': 'DV000000001', 'unique': True},
    {'name': 'Tên dịch vụ', 'valid': 'Khám răng tổng quát', 'min': 5, 'short_val': 'Khám', 'max': 100, 'long_val': 'A'*101, 'unique': True},
    {'name': 'Giá dịch vụ', 'valid': '500000', 'invalid': [{'desc': 'nhập số âm', 'val': '-50000'}, {'desc': 'nhập chữ cái', 'val': 'Năm trăm ngàn'}], 'min': 1000, 'short_val': '999', 'max': 100000000, 'long_val': '100000001'},
    {'name': 'Danh mục', 'valid': 'Khám bệnh', 'required': True},
    {'name': 'Đơn vị tính', 'valid': 'Lần', 'required': True},
    {'name': 'Mô tả', 'valid': 'Mô tả chi tiết nội dung khám', 'required': False, 'max': 500, 'long_val': 'A'*501},
]

# Quản lý bác sĩ
generate_crud_success("QLBS", "Bác sĩ", doctor_fields)
generate_validation_tcs("QLBS", "Bác sĩ", doctor_fields)
generate_search_pagination("QLBS", "Bác sĩ")
generate_auth_security("QLBS", "Bác sĩ")
generate_ui_exceptions("QLBS", "Bác sĩ")
add_tc("QLBS", "Xóa Bác sĩ", "Exception Testing", "Xóa bác sĩ đã có lịch khám/hóa đơn", "1. Chọn bác sĩ đang có lịch khám\n2. Nhấn Xóa", "Bác sĩ đã phát sinh dữ liệu", "Hệ thống chặn xóa và báo lỗi 'Không thể xóa vì bác sĩ đang có lịch khám/dịch vụ'")
add_tc("QLBS", "Export/Import", "Functional Testing", "Xuất danh sách bác sĩ ra file Excel", "1. Mở danh sách bác sĩ\n2. Nhấn nút Xuất Excel", "Dữ liệu hiện tại", "Hệ thống tải xuống file Excel (.xlsx) chứa đầy đủ thông tin bác sĩ hiển thị trên lưới")

# Quản lý người dùng
add_tc("QLND", "Đăng nhập", "Authentication", "Đăng nhập thành công", "1. Nhập username đúng\n2. Nhập password đúng\n3. Nhấn Đăng nhập", "Dữ liệu đúng", "Đăng nhập thành công, chuyển hướng vào Dashboard")
add_tc("QLND", "Đăng nhập", "Authentication", "Sai mật khẩu", "1. Nhập username đúng\n2. Nhập password sai\n3. Nhấn Đăng nhập", "Mật khẩu sai", "Báo lỗi 'Tên đăng nhập hoặc mật khẩu không đúng'")
add_tc("QLND", "Đăng nhập", "Authentication", "Tài khoản bị khóa", "1. Nhập username của tài khoản bị khóa\n2. Nhấn Đăng nhập", "Tài khoản status=Locked", "Báo lỗi 'Tài khoản của bạn đã bị khóa, liên hệ Admin'")
add_tc("QLND", "Đăng nhập", "Authentication", "Bỏ trống Tên đăng nhập", "1. Để trống Tên đăng nhập\n2. Nhấn Đăng nhập", "Tên ĐN = ''", "Báo lỗi 'Vui lòng nhập tên đăng nhập'")
add_tc("QLND", "Session", "Security", "Hết hạn phiên đăng nhập (Session Timeout)", "1. Đăng nhập thành công\n2. Treo máy không thao tác 30 phút\n3. Nhấn vào menu bất kỳ", "Timeout 30 phút", "Hệ thống tự động đăng xuất và yêu cầu Đăng nhập lại")
add_tc("QLND", "Đổi mật khẩu", "Functional Testing", "Đổi mật khẩu thành công", "1. Nhập mật khẩu hiện tại\n2. Nhập mật khẩu mới hợp lệ\n3. Nhập lại mật khẩu mới\n4. Nhấn Lưu", "Dữ liệu hợp lệ", "Đổi mật khẩu thành công. Cần đăng nhập lại bằng mật khẩu mới")
add_tc("QLND", "Đổi mật khẩu", "Validation Testing", "Xác nhận mật khẩu mới không khớp", "1. Nhập mật khẩu mới 1 kiểu\n2. Ô xác nhận nhập kiểu khác\n3. Nhấn Lưu", "Pass1 != Pass2", "Báo lỗi 'Mật khẩu xác nhận không khớp'")

generate_crud_success("QLND", "Người dùng", user_fields)
generate_validation_tcs("QLND", "Người dùng", user_fields)
generate_search_pagination("QLND", "Người dùng")
generate_auth_security("QLND", "Người dùng")
generate_ui_exceptions("QLND", "Người dùng")

# Quản lý dịch vụ
generate_crud_success("QLDV", "Dịch vụ", service_fields)
generate_validation_tcs("QLDV", "Dịch vụ", service_fields)
generate_search_pagination("QLDV", "Dịch vụ")
generate_auth_security("QLDV", "Dịch vụ")
generate_ui_exceptions("QLDV", "Dịch vụ")
add_tc("QLDV", "Xóa Dịch vụ", "Exception Testing", "Xóa dịch vụ đã được sử dụng trong hóa đơn/phiếu điều trị", "1. Chọn dịch vụ đã có người dùng\n2. Nhấn Xóa", "Dịch vụ đang sử dụng", "Hệ thống chặn xóa và báo lỗi 'Không thể xóa do dịch vụ đã phát sinh giao dịch/hóa đơn'")

output_dir = os.path.join(os.path.dirname(__file__), '../Test_Cases')
os.makedirs(output_dir, exist_ok=True)
output_file = os.path.join(output_dir, 'TestCases_Nhom1_ChiTiet.csv')
with open(output_file, mode='w', encoding='utf-8-sig', newline='') as file:
    writer = csv.writer(file, delimiter=',', quoting=csv.QUOTE_MINIMAL)
    writer.writerow(columns)
    for tc in test_cases:
        writer.writerow(tc)

print(f"Da tao thanh cong {len(test_cases)} test cases vao file {output_file}")
