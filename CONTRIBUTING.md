# Quy ước đóng góp

- Tài liệu đang duy trì dùng tiếng Việt. Tên file, thư mục, hàm và biến dùng tiếng Anh; không đổi trường API hay dữ liệu nghiệp vụ chỉ để đổi ngôn ngữ.
- Thư mục/tài liệu mới dùng kebab-case, giữ tên chuẩn README.md. Thành phần React và page object dùng PascalCase; Python dùng snake_case.
- Báo cáo, dữ liệu và bộ sinh lịch sử trong `docs/qa/archive/` giữ nguyên tên để đối chiếu.
- Test phải kiểm tra kết quả quan sát được. Không tính khung rỗng hoặc chỉ mở trang thành kiểm chứng chức năng.
- Dữ liệu Pass/Fail ngẫu nhiên không phải kết quả chạy. Khi đưa bằng chứng vào repo, ghi commit, môi trường, lệnh và phạm vi.
- Không đưa node_modules, file môi trường, mật khẩu hay kết quả tạm vào Git.
- Khi di chuyển file, cập nhật import, CI, lệnh chạy và liên kết tài liệu. Chạy các kiểm tra liên quan trước khi đẩy mã.
- Đọc các seed và script bảo trì trước khi chạy: một số script cũ xóa dữ liệu. Chỉ dùng DB thử nghiệm.
- Cần giải thích được mã và giới hạn của thay đổi, kể cả khi có AI hỗ trợ.
