# Cypress automation

`cypress/e2e/` chứa login và core workflows; `cypress/pages/`, `cypress/support/` giữ page object và commands. `fixtures/` tạo tiền điều kiện và dọn dữ liệu thử. Cypress config, package và lockfile nằm tại thư mục này.

Chuẩn bị API/UI theo [README gốc](../README.md). Từ thư mục gốc:

```sh
npm ci --prefix automation-testing
node --env-file=.env.test .github/qa/scripts/run-qa.js --suite=ui
```

Để chạy toàn bộ API + defect regression + Cypress:

```sh
node --env-file=.env.test .github/qa/scripts/run-qa.js
```

12 UI tests dùng selector ổn định, retry 0 và GET kiểm tra dữ liệu sau thao tác. Luồng check-in và thu tiền thao tác UI; giai đoạn điều trị ở luồng BUG-004 dùng API, không mô tả là toàn bộ luồng đi qua UI. Fixture và assertions giữ nguyên khi đổi cấu trúc.

[Reports](reports/README.md) chứa kết quả đã công bố và metadata CI. Runtime screenshot/video/HTML/log nằm trong `reports/generated/`, bị Git bỏ qua và được upload làm artifact CI. Bất kỳ test Fail/Not Run hoặc lỗi process đều làm QA fail.
