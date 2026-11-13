# Kiểm thử giao diện bằng Cypress

Bộ đang duy trì ở `cypress/e2e/login.cy.js` và `cypress/e2e/core-workflows.cy.js`, tổng cộng 17 case E2E/API-hybrid. Các kịch bản Cypress legacy chưa xác minh đã được loại bỏ để tránh nhầm với bộ kiểm thử đang duy trì.

Đọc [hướng dẫn QA](../../docs/qa/README.md) để tạo tài khoản thử nghiệm, chạy API và cấu hình môi trường. Các giá trị trong `.env.example` chỉ là mẫu; Cypress không tự đọc file này.

- `npm run cy:open`: mở Cypress tương tác sau khi đã nạp môi trường.
- `npm run cy:smoke`: chạy smoke login.
- `npm run cy:run`: chạy toàn bộ 17 case Cypress.

Từ thư mục gốc, nạp môi trường QA khi chạy bằng npm:

```powershell
Get-Content testing/.env.test | ForEach-Object {
  if ($_ -match '^([^#=]+)=(.*)$') {
    Set-Item "Env:$($matches[1])" $matches[2]
  }
}
npm run cy:smoke --prefix testing/e2e
npm run cy:run --prefix testing/e2e
```

Hoặc chuyển vào `testing/e2e` trước khi truyền `--spec`:

```powershell
Push-Location testing/e2e
node --env-file=../.env.test node_modules/cypress/bin/cypress run --spec cypress/e2e/login.cy.js
Pop-Location
```

Báo cáo do cypress-mochawesome-reporter tạo trực tiếp trong `cypress/reports/`; không cần script merge cũ với công cụ chưa khai báo.
