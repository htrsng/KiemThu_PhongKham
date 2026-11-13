# Quy ước QA

## Phạm vi trách nhiệm

Ứng dụng trong `client/` và `server/` là đối tượng được kiểm thử. Phần QA do mình thực hiện nằm ở `testing/` và `docs/qa/`.

## Mã định danh

- Test case: `TC-<AREA>-<SỐ>`, ví dụ `TC-AUTH-001`.
- Bug: `BUG-<SỐ>`, ví dụ `BUG-001`.
- Requirement: `REQ-<AREA>-<SỐ>` khi cần liên kết yêu cầu với test case.

Tên mã phải ổn định sau khi test được đưa vào báo cáo. Không dùng số dòng hoặc tên người kiểm thử làm mã định danh.

## Severity và priority

### Severity

| Mức | Ý nghĩa |
|---|---|
| Critical | Mất dữ liệu, lộ bí mật, không thể sử dụng hệ thống hoặc lỗi chặn toàn bộ luồng chính |
| High | Hỏng nghiệp vụ quan trọng, sai quyền truy cập hoặc ảnh hưởng lớn đến nhiều người dùng |
| Medium | Hỏng một chức năng với workaround khả thi hoặc ảnh hưởng giới hạn |
| Low | Lỗi giao diện, nội dung hoặc trường hợp biên ít ảnh hưởng |

### Priority

| Mức | Ý nghĩa |
|---|---|
| P0 | Sửa ngay trước mọi kiểm thử/phát hành tiếp theo |
| P1 | Sửa trong chu kỳ hiện tại |
| P2 | Sửa trong chu kỳ kế tiếp |
| P3 | Có thể lên backlog |

Severity mô tả mức độ ảnh hưởng; priority mô tả thứ tự xử lý. Hai giá trị không nhất thiết giống nhau.

## Nguyên tắc dữ liệu

- Chỉ dùng MongoDB riêng cho QA, tên DB kết thúc bằng `_test`.
- Không chạy seed hoặc script bảo trì cũ trên DB thật.
- Credential phải lấy từ biến môi trường hoặc `prepare-env.js`; không ghi vào test, fixture, log, report hoặc commit.
- Khi phát hiện credential đã từng commit, phải thu hồi/thay mới ở hệ thống cung cấp credential, không chỉ xóa khỏi working tree.
