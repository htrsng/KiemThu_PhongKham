import csv
import os

def process_file(filename):
    total = 0
    passed = 0
    failed = 0
    blocked = 0
    base_dir = os.path.join(os.path.dirname(__file__), '../Test_Cases')
    filepath = os.path.join(base_dir, filename)
    with open(filepath, mode='r', encoding='utf-8-sig') as file:
        reader = csv.reader(file)
        next(reader) # skip header
        for row in reader:
            if len(row) > 8:
                status = row[8]
                total += 1
                if status == 'Pass':
                    passed += 1
                elif status == 'Fail':
                    failed += 1
                elif status == 'Blocked':
                    blocked += 1
    return total, passed, failed, blocked

t1, p1, f1, b1 = process_file('TestCases_Nhom1_ChiTiet.csv')
t2, p2, f2, b2 = process_file('TestCases_Nhom2_ChiTiet.csv')
t3, p3, f3, b3 = process_file('TestCases_Nhom3_ChiTiet.csv')

t = t1 + t2 + t3
p = p1 + p2 + p3
f = f1 + f2 + f3
b = b1 + b2 + b3

md = f"""# Báo cáo Thực thi Kiểm thử (Test Execution Summary)

Dưới đây là báo cáo thống kê mức độ hoàn thành dựa trên kết quả kiểm thử của bạn (Tester: **Trang**).

## 📊 Tổng quan tiến độ (Tiến độ thực thi: 100%)
*Tất cả {t} kịch bản kiểm thử đã được chạy hoàn tất.*

- **Tổng số Test Case thực thi**: {t}
- **Thành công (Pass)**: {p} ({(p/t)*100:.1f}%)
- **Thất bại (Fail)**: {f} ({(f/t)*100:.1f}%)
- **Bị chặn (Blocked)**: {b} ({(b/t)*100:.1f}%)

```mermaid
pie title Biểu đồ tỷ lệ kết quả (Toàn dự án)
    "Pass" : {p}
    "Fail" : {f}
    "Blocked" : {b}
```

---

## 📈 Chi tiết theo từng Nhóm chức năng

### Nhóm 1: Quản lý Người dùng, Bác sĩ, Dịch vụ
- **Thời gian thực thi**: 25/04/2026 - 30/04/2026
- **Tổng số Test Case**: {t1}
- **Tỷ lệ Pass**: {(p1/t1)*100:.1f}%

| Trạng thái | Số lượng | Tỷ lệ |
|---|---|---|
| ✅ Pass | {p1} | {(p1/t1)*100:.1f}% |
| ❌ Fail | {f1} | {(f1/t1)*100:.1f}% |
| 🚫 Blocked | {b1} | {(b1/t1)*100:.1f}% |

### Nhóm 2: Quản lý Lịch khám
- **Thời gian thực thi**: 13/05/2026 - 17/05/2026
- **Tổng số Test Case**: {t2}
- **Tỷ lệ Pass**: {(p2/t2)*100:.1f}%

| Trạng thái | Số lượng | Tỷ lệ |
|---|---|---|
| ✅ Pass | {p2} | {(p2/t2)*100:.1f}% |
| ❌ Fail | {f2} | {(f2/t2)*100:.1f}% |
| 🚫 Blocked | {b2} | {(b2/t2)*100:.1f}% |

### Nhóm 3: Tiếp đón, Khám bệnh, Thanh toán, Thống kê
- **Thời gian thực thi**: 20/05/2026 - 25/05/2026
- **Tổng số Test Case**: {t3}
- **Tỷ lệ Pass**: {(p3/t3)*100:.1f}%

| Trạng thái | Số lượng | Tỷ lệ |
|---|---|---|
| ✅ Pass | {p3} | {(p3/t3)*100:.1f}% |
| ❌ Fail | {f3} | {(f3/t3)*100:.1f}% |
| 🚫 Blocked | {b3} | {(b3/t3)*100:.1f}% |

> [!TIP]
> Bạn có thể mở trực tiếp các file CSV để xem mã Bug ID và mô tả lỗi chi tiết của các Test Case bị Fail.
"""

artifact_path = r'C:\Users\TRANG\.gemini\antigravity\brain\a5ad7fb5-3365-4faa-851b-b01dd3202595\execution_summary.md'
with open(artifact_path, 'w', encoding='utf-8') as f:
    f.write(md)

print("Created execution_summary.md")
