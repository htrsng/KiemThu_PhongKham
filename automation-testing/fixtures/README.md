# QA fixtures

`qa-data.js` được Node API tests, Cypress tasks và Newman runner dùng chung. Mỗi fixture có doctor/patient/service/shift và ID riêng; các hành động nghiệp vụ đang kiểm tra đi qua HTTP hoặc UI. Chỉ dùng loopback API/MongoDB và DB kết thúc `_test`.

Cleanup chỉ xóa dữ liệu do process sở hữu, không drop database. Không lưu tài khoản, token, mật khẩu hoặc hồ sơ bệnh nhân thật trong thư mục này.
