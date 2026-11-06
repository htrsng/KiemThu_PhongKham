# Hướng dẫn kiểm thử SmileCare

## Phạm vi đang duy trì

- `testing/api/auth.test.js`: 8 kiểm tra API đăng nhập và phiên.
- `testing/e2e/cypress/e2e/login.cy.js`: 5 kiểm tra giao diện với backend thật.
- `testing/e2e/cypress/legacy/`: kịch bản cũ chưa xác minh, không chạy mặc định.
- `docs/qa/archive/`: tài liệu và bộ sinh học tập gốc.

## Chuẩn bị môi trường thử nghiệm cục bộ

Chỉ sử dụng MongoDB cục bộ riêng cho QA. Cài thư viện theo README chính. Tại thư mục gốc chạy:

```sh
node testing/scripts/prepare-env.js
node --env-file=testing/.env.test testing/scripts/seed-test-accounts.js
```

File `testing/.env.test` chứa thông tin ngẫu nhiên của lần thử và được Git bỏ qua. Bộ seed chỉ chấp nhận URI MongoDB loopback và tên DB kết thúc `_test`; tạo/cập nhật đúng hai tài khoản tổng hợp, không xóa toàn DB. Chạy lại prepare-env sinh một bộ tài khoản mới.

Mở backend bằng môi trường QA, không dùng backend đang nối dữ liệu thật:

```sh
node --env-file=testing/.env.test server/server.js
```

Trong cửa sổ khác chạy giao diện:

```sh
npm run dev --prefix client
```

Sau khi ứng dụng sẵn sàng, chạy từ thư mục gốc:

```sh
node testing/scripts/wait-for-app.js
node --env-file=testing/.env.test --test --test-concurrency=1 testing/api/auth.test.js
node --env-file=testing/.env.test testing/e2e/node_modules/cypress/bin/cypress run --project testing/e2e
```

Không đưa file môi trường QA vào báo cáo công khai. Tài khoản chỉ tồn tại trong DB thử nghiệm, không dùng để triển khai.

## Chạy trên GitHub

Workflow `Clinic QA Checks` tự chuẩn bị MongoDB, môi trường và tài khoản tạm, sau đó chạy API và Cypress. Báo cáo, ảnh lỗi và log nằm trong artifact `clinic-qa-evidence`.

Muốn khảo sát bộ cũ: vào Actions, chọn workflow, Run workflow và bật `run_legacy`. Bộ này có thể lỗi do dữ liệu, selector và nghiệp vụ chưa được hoàn thiện. Chạy được không tự chứng minh mọi yêu cầu đã được kiểm thử.

## Bằng chứng

Ghi rõ commit, môi trường, lệnh và kết quả quan sát. Các bảng ở `archive/` giữ nguyên nội dung lịch sử, kể cả đường dẫn và tên file cũ. Không trộn trạng thái ngẫu nhiên của bộ sinh với kết quả thật từ CI.
