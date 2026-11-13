# Test summary report — 13/11/2026

## Mục tiêu và môi trường

Đánh giá bộ QA cho portfolio intern tester, ưu tiên đăng nhập, phân quyền, lịch hẹn/check-in và hóa đơn. Thực thi trên Windows, Node.js 22.15.0, MongoDB 8.2.3 loopback riêng có tên kết thúc `_test`, Cypress 15.17.0 / Electron 138 headless. CI dùng Node.js 24 và MongoDB 7; chưa ghi nhận một lần CI mới cho các thay đổi hiện tại.

Nguồn kiểm thử: working tree dựa trên commit `68a2e6ae63961e04aedc995a30319fa4912231fb`. [Manifest API](evidence/2026-11-13/api-manifest.json) và [hash nguồn](evidence/2026-11-13/source-hashes.json) xác định các file đã chạy; không gán kết quả này cho nguyên trạng base commit.

## Kết quả hiện tại

| Bộ | Total | Pass | Fail | Blocked / skipped | Not Run |
| --- | ---: | ---: | ---: | ---: | ---: |
| API regression | 26 | 26 | 0 | 0 | 0 |
| Cypress UI | 10 | 10 | 0 | 0 | 0 |
| Known-defect requirement tests | 2 | 0 | 2 | 0 | 0 |
| Manual designs | 70 | 0 | 0 | 0 | 70 |

Tổng tự động: **36 Pass / 38 test thực thi; 2 Fail**. Hai Fail tương ứng BUG-002 và BUG-003; không bị bỏ qua, đổi expected hoặc tính vào Pass. Build frontend đạt; QA audit xác nhận 70 mã case duy nhất, 31 mã yêu cầu duy nhất và mọi case đều được ánh xạ. RTM là coverage thiết kế, không phải tỷ lệ thực thi hay code coverage.

## Nhận định

Smoke đăng nhập, RBAC tài khoản/xóa hóa đơn, tạo lịch hợp lệ/quá khứ/trùng, check-in, tạo hóa đơn lần đầu và quy tắc thanh toán được xác minh ở mức assertion cụ thể trong suite. Cypress có check-in qua UI và đọc lại dữ liệu bằng API; ca hóa đơn UI chỉ xác minh hiển thị, chưa chứng minh thao tác thu tiền trên giao diện.

**Chưa đạt tiêu chí sẵn sàng phát hành.** Hai lỗi High còn mở: cho phép lùi trạng thái đã hoàn thành và tạo trùng hóa đơn khi hoàn thành lặp. Các case manual P0/P1 chưa được thực thi; hai case payroll trong RTM thuộc phạm vi hoãn lại. Không suy ra chất lượng toàn ứng dụng từ regression xanh.

## Bằng chứng và hồi quy

- [Danh mục evidence và lệnh chạy](evidence/2026-11-13/README.md).
- [Bug register](bug-report.md): BUG-001 tiếp tục đạt ca sai mật khẩu; BUG-002/003 còn Fail và chưa có bản sửa để retest.
- [Workbook manual](test-execution.xlsx): toàn bộ dòng khởi tạo `Not Run`, dành cho người kiểm thử ghi thực thi thật.
- [Kết quả CI lịch sử 06/11/2026](bugs/BUG-001.md): 8 API + 5 UI trên CI, không cộng dồn để tăng số test hiện tại.

Log chưa bao gồm một chiến dịch manual, test tải, nhiều browser hoặc xác minh cơ sở dữ liệu production. Số ca Pass hiện tại không phải số yêu cầu được xác minh đầy đủ.
