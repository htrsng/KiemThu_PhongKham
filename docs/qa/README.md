# Hướng dẫn kiểm thử SmileCare

## Giai đoạn 0 — dọn nền

Ứng dụng trong `client/` và `server/` là đối tượng được kiểm thử. Phần QA do mình thực hiện nằm ở `testing/` và `docs/qa/`. Các mã test case, mã bug, severity và priority dùng theo [quy ước QA](./conventions.md).

Không có credential thật trong working tree hiện tại. Tuy nhiên lịch sử Git từng chứa file `server/.env` có chuỗi kết nối MongoDB Atlas; chủ sở hữu phải thu hồi/thay credential Atlas đó nếu còn hoạt động. Các seed cũ đã được đổi để nhận mật khẩu qua biến môi trường, không còn mật khẩu mặc định trong mã.

Mẫu biến môi trường QA ở [`testing/.env.example`](../../testing/.env.example). Dùng [`testing/scripts/prepare-env.js`](../../testing/scripts/prepare-env.js) để sinh giá trị tạm thời; không commit `testing/.env.test`.

## Phạm vi đang duy trì

- `testing/api/auth.test.js`: 8 kiểm tra API đăng nhập và phiên.
- `testing/api/authorization-invoice.test.js`: 10 kiểm tra API phân quyền, lịch hẹn và hóa đơn.
- `testing/api/`: kiểm thử tự động bằng Node.js, chạy được trong CI và phù hợp để hồi quy.
- `testing/e2e/cypress/e2e/login.cy.js`: 5 kiểm tra giao diện với backend thật.
- `testing/e2e/cypress/e2e/core-workflows.cy.js`: 12 kiểm tra workflow và phân quyền.
- `testing/manual/test-cases.tsv`: 70 test case thiết kế cho bốn module ưu tiên, mở được bằng Excel/Google Sheets.
- `testing/postman/`: collection và environment để khám phá thủ công, tái hiện và điều tra bug API.
- `docs/qa/rtm.tsv`: ma trận truy xuất 27 yêu cầu trong phạm vi tới test case.
- `docs/qa/bug-report.md`: bug report và trạng thái xử lý.
- `docs/qa/test-report.md`: kết quả runtime đã có bằng chứng.
- `docs/qa/bugs/`: mỗi bug một file với mô tả, severity, priority và regression test.
- `docs/qa/evidence/`: quy ước lưu log, ảnh, video và artifact đã chọn lọc.
- `docs/qa/archive/`: tài liệu và bộ sinh học tập gốc.

## Chuẩn bị môi trường thử nghiệm cục bộ

Chỉ sử dụng MongoDB cục bộ riêng cho QA. Cài thư viện theo README chính. Tại thư mục gốc chạy:

```sh
node testing/scripts/prepare-env.js
node --env-file=testing/.env.test testing/scripts/seed-test-accounts.js
```

File `testing/.env.test` chứa thông tin ngẫu nhiên của lần thử và được Git bỏ qua. Bộ seed chỉ chấp nhận URI MongoDB loopback và tên DB kết thúc `_test`; tạo/cập nhật tài khoản Admin, Admin bị khóa, Doctor và Reception cùng dữ liệu nền QA, không xóa toàn DB. Chạy lại prepare-env sinh một bộ tài khoản mới.

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
node --env-file=testing/.env.test --test --test-concurrency=1 testing/api/authorization-invoice.test.js
Push-Location testing/e2e
node --env-file=../.env.test node_modules/cypress/bin/cypress run --spec cypress/e2e/login.cy.js
Pop-Location
```

Hoặc nạp biến môi trường vào PowerShell rồi chạy toàn bộ Cypress bằng npm:

```powershell
Get-Content testing/.env.test | ForEach-Object {
  if ($_ -match '^([^#=]+)=(.*)$') {
    Set-Item "Env:$($matches[1])" $matches[2]
  }
}
npm run cy:run --prefix testing/e2e
```

Khi chạy một spec riêng, `--spec` phải được tính tương đối từ project
`testing/e2e`. Không truyền `--project testing/e2e --spec cypress/...` từ thư mục
gốc, vì Cypress có thể tìm spec trong `D:\KiemThu_PhongKham\cypress\` thay vì
`testing/e2e/cypress/`.

Không đưa file môi trường QA vào báo cáo công khai. Tài khoản chỉ tồn tại trong DB thử nghiệm, không dùng để triển khai.

## Chạy trên GitHub

Workflow `Clinic QA Checks` tự chuẩn bị MongoDB, môi trường và tài khoản tạm, sau đó chạy API và Cypress. Báo cáo, ảnh lỗi và log nằm trong artifact `clinic-qa-evidence`.

## Bằng chứng

Ghi rõ commit, môi trường, lệnh và kết quả quan sát. Các bảng ở `archive/` giữ nguyên nội dung lịch sử, kể cả đường dẫn và tên file cũ. Không trộn trạng thái ngẫu nhiên của bộ sinh với kết quả thật từ CI.
