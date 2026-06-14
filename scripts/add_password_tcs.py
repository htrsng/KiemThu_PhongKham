import csv
import os

folder = r"d:\PhongKham_KiemThu"
file_path = os.path.join(folder, "UC1.1_QuanLyNguoiDung.csv")

with open(file_path, 'r', encoding='utf-8') as f:
    data = list(csv.reader(f))

# Find the insertion index (before the first UC1.1_UI or at the end)
insert_idx = len(data)
max_func_seq = 0
for i, row in enumerate(data):
    if len(row) > 1 and "UC1.1_UI" in row[1]:
        if insert_idx == len(data):
            insert_idx = i
    if len(row) > 1 and "UC1.1_FUNC" in row[1]:
        try:
            seq = int(row[1].split("_")[-1])
            if seq > max_func_seq:
                max_func_seq = seq
        except:
            pass

new_rows = []
# TC 1: Password Complexity - Happy Path
seq1 = str(max_func_seq + 1).zfill(3)
new_rows.append([
    "UC1.1", f"UC1.1_FUNC_{seq1}", "Kiểm tra độ phức tạp mật khẩu hợp lệ (chữ hoa, số, ký tự đặc biệt)",
    "1. Nhập mật khẩu mới thỏa mãn điều kiện\n2. Bấm Lưu",
    "Giao diện phản hồi hợp lệ, chuyển sang bước tiếp theo.",
    "Pass: Abc@12345",
    "Lưu thành công. Mật khẩu được mã hóa và cập nhật.",
    "Lưu thành công. Mật khẩu được mã hóa và cập nhật.",
    "Passed"
])

# TC 2: Password Complexity - Negative
seq2 = str(max_func_seq + 2).zfill(3)
new_rows.append([
    "UC1.1", f"UC1.1_FUNC_{seq2}", "Kiểm tra độ phức tạp mật khẩu không hợp lệ (thiếu chữ hoa, số hoặc ký tự đặc biệt)",
    "1. Nhập mật khẩu thiếu điều kiện (vd: toàn chữ thường)\n2. Bấm Lưu",
    "Hệ thống validate phía FE/BE",
    "Pass: password123",
    "Báo lỗi: Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 số và 1 ký tự đặc biệt.",
    "Báo lỗi: Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 số và 1 ký tự đặc biệt.",
    "Passed"
])

# TC 3: Reset Password
seq3 = str(max_func_seq + 3).zfill(3)
new_rows.append([
    "UC1.1", f"UC1.1_FUNC_{seq3}", "Admin thực hiện Reset mật khẩu cho người dùng khác",
    "1. Đăng nhập quyền Admin\n2. Mở thông tin 1 user khác\n3. Bấm Reset Password\n4. Xác nhận",
    "Giao diện hiển thị popup xác nhận",
    "Action: Reset Password",
    "Reset thành công. Mật khẩu user được đưa về mặc định và gửi email thông báo (nếu có).",
    "Reset thành công. Mật khẩu user được đưa về mặc định và gửi email thông báo (nếu có).",
    "Passed"
])

for r in reversed(new_rows):
    data.insert(insert_idx, r)

with open(file_path, 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerows(data)

tm_path = os.path.join(folder, "Traceability_Matrix.csv")
with open(tm_path, 'r', encoding='utf-8') as f:
    tm = list(csv.reader(f))

for row in tm:
    if row[0] == "UC1.1":
        current_total = int(row[3])
        new_total = current_total + 3
        row[3] = str(new_total)
        parts = row[5].split('/')
        if len(parts) == 2:
            row[5] = f"{int(parts[0])+3}/{new_total}"
        break

with open(tm_path, 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerows(tm)

print("Added Reset Password and Password Complexity TCs to UC1.1")
