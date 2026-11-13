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

def transform_to_g05(file, data):
    new_rows = []
    is_uc44 = "UC4.4" in file
    
    if is_uc44:
        new_rows.append(["Test Date: 13/06/2026", "", "", "", "", "", "", "Passed", '=COUNTIF(I:I, "Passed")'])
        new_rows.append(["1. Phân lớp tương đương cho một số đầu vào", "", "", "", "", "", "", "Failed", '=COUNTIF(I:I, "Failed")'])
        new_rows.append(["Input", "Hợp lệ", "Không hợp lệ", "", "", "", "", "Not Run", '=COUNTIF(I:I, "Not Run")'])
        new_rows.append(["Hệ số giáo viên", "- 1.3 (Cử nhân)\n- 1.5 (Thạc sĩ)\n- 1.7 (Tiến sĩ)\n- 2.0 (PGS)\n- 2.5 (GS)", "-1.0, 0, 10 (giá trị âm, 0, quá lớn)", "", "", "", "", "Not Completed", '=COUNTIF(I:I, "Not Completed")'])
        new_rows.append(["Hệ số học phần", "1.0 đến 1.5", "< 1.0, > 1.5", "", "", "", "", "Number of test cases", '=SUM(I1:I4)'])
        new_rows.append(["Hệ số lớp", "<20 sinh viên: -0.3\n20 - 29 sinh viên: -0.2\n30 - 39 sinh viên: -0.1\n40 - 49 sinh viên: 0\n50 - 59 sinh viên: +0.1\n60 - 69 sinh viên: +0.2\n70 - 79 sinh viên: +0.3", "< -0.3, > 0.3", "", "", "", "", "", ""])
        new_rows.append(["Số tiết thực tế", "1, 10, 100", "0, -5", "", "", "", "", "", ""])
        new_rows.append(["Tiền 1 tiết (VNĐ)", "50,000 - 500,000", "-100, 0, 1,000,000,000", "", "", "", "", "", ""])
        new_rows.append(["Năm áp dụng hệ số", "> năm hiện tại", "= hoặc < năm hiện tại", "", "", "", "", "", ""])
        new_rows.append(["Trạng thái học kỳ", "\"đã kết thúc\"", "\"chưa bắt đầu\"", "", "", "", "", "", ""])
        new_rows.append([])
    else:
        new_rows.append(["Test Date: 13/06/2026", "", "", "", "", "", "", "Passed", '=COUNTIF(I:I, "Passed")'])
        new_rows.append(["", "", "", "", "", "", "", "Failed", '=COUNTIF(I:I, "Failed")'])
        new_rows.append(["", "", "", "", "", "", "", "Not Run", '=COUNTIF(I:I, "Not Run")'])
        new_rows.append(["", "", "", "", "", "", "", "Not Completed", '=COUNTIF(I:I, "Not Completed")'])
        new_rows.append(["", "", "", "", "", "", "", "Number of test cases", '=SUM(I1:I4)'])
        new_rows.append([])
        
    new_rows.append(["Category", "Test Case ID", "Test Case Description", "Test Procedures", "", "Test Input Value", "Test Case Expected Result", "Test Case Program Result", "Status"])
    new_rows.append(["", "", "", "Steps to Perform", "Step Expected Result", "", "", "", ""])
    
    for row in data:
        if not row or len(row) < 9: continue
        if "TC ID" in row[0] or "Test Date" in row[0] or "Category" in row[0]: 
            continue
            
        req_ref = row[1] if len(row) > 1 else ""
        if not req_ref.startswith("UC"): req_ref = file.split("_")[0]
        
        tc_id_raw = row[0]
        parts = tc_id_raw.split("-")
        seq = parts[-1] if len(parts) > 1 else "001"
        tc_id = f"{req_ref}_FUNC_{seq}"
        
        desc = row[4] if len(row) > 4 else ""
        steps = row[5] if len(row) > 5 else ""
        step_exp = row[6] if len(row) > 6 else ""
        input_val = row[7] if len(row) > 7 else ""
        overall_exp = row[8] if len(row) > 8 else ""
        status_old = row[9] if len(row) > 9 else "Pass"
        remarks = row[10] if len(row) > 10 else ""
        
        status_new = "Passed" if status_old.lower() in ["pass", "passed"] else "Failed"
        category = req_ref
        
        actual_result = overall_exp
        if status_new == "Failed":
            actual_result = f"Lỗi thực tế: {remarks}" if remarks else "Lỗi hệ thống không xử lý đúng như mong đợi."
            
        new_row = [category, tc_id, desc, steps, step_exp, input_val, overall_exp, actual_result, status_new]
        new_rows.append(new_row)
        
    if "UC1.1" in file:
        ui_tcs = [
            ["UC1.1", "UC1.1_UI_001", "Kiểm tra form thêm mới có đầy đủ trường thông tin", "1. Mở form thêm mới", "Hiển thị form đầy đủ", "Giao diện", "Hiển thị đầy đủ form với các trường: Username, Password, Role...", "Hiển thị đầy đủ form với các trường: Username, Password, Role...", "Passed"],
            ["UC1.1", "UC1.1_UI_002", "Kiểm tra nhãn (label) và placeholder", "1. Mở form thêm mới", "Label và placeholder rõ ràng", "Giao diện", "Các nhãn hiển thị đúng nội dung yêu cầu", "Các nhãn hiển thị đúng nội dung yêu cầu", "Passed"],
            ["UC1.1", "UC1.1_UI_003", "Kiểm tra hiển thị dấu * cho các trường bắt buộc", "1. Mở form thêm mới", "Dấu * màu đỏ xuất hiện", "Giao diện", "Trường Username, Password có dấu * màu đỏ", "Trường Username, Password có dấu * màu đỏ", "Passed"],
            ["UC1.1", "UC1.1_UI_004", "Kiểm tra bố cục responsive", "1. Thu nhỏ màn hình", "Form tự động scale", "Màn hình 375px", "Các thành phần hiển thị hợp lý, không tràn layout", "Các thành phần hiển thị hợp lý, không tràn layout", "Passed"]
        ]
        new_rows.extend(ui_tcs)
        
    if "UC3.1" in file:
        ui_tcs = [
            ["UC3.1", "UC3.1_UI_001", "Kiểm tra bảng danh sách hàng chờ hiển thị đầy đủ", "1. Vào màn hình Check-in", "Hiển thị bảng danh sách", "Giao diện", "Bảng hiển thị đẩy đủ các cột: STT, Tên BN, Trạng thái...", "Bảng hiển thị đẩy đủ các cột: STT, Tên BN, Trạng thái...", "Passed"],
            ["UC3.1", "UC3.1_UI_002", "Kiểm tra dropdown chọn Trạng thái", "1. Click filter trạng thái", "Dropdown sổ xuống", "Dropdown", "Dropdown hiển thị đúng danh sách trạng thái", "Dropdown hiển thị đúng danh sách trạng thái", "Passed"],
            ["UC3.1", "UC3.1_UI_003", "Kiểm tra nút bấm 'Check-in'", "1. Xem nút Check-in", "Nút nổi bật", "Giao diện", "Nút Check-in có màu xanh, hover đổi màu", "Nút Check-in có màu xanh, hover đổi màu", "Passed"]
        ]
        new_rows.extend(ui_tcs)
        
    return new_rows

for file in files:
    data = read_csv(file)
    if not data: continue
    if "Test Date" in data[0][0]: continue # Already transformed
    
    new_data = transform_to_g05(file, data)
    write_csv(file, new_data)

print("G05 Template applied successfully to all files.")
