# Kiểm thử giao diện bằng Cypress

Bộ đang duy trì ở `cypress/e2e/login.cy.js`. Các kịch bản cũ ở `cypress/legacy/` chưa được xác minh và không chạy mặc định.

Đọc [hướng dẫn QA](../../docs/qa/README.md) để tạo tài khoản thử nghiệm, chạy API và cấu hình môi trường. Các giá trị trong `.env.example` chỉ là mẫu; Cypress không tự đọc file này.

- `npm run cy:open`: mở Cypress tương tác sau khi đã nạp môi trường.
- `npm run cy:smoke` hoặc `npm run cy:run`: chạy bộ đăng nhập hiện tại.
- `npm run cy:legacy`: chạy bộ cũ để khảo sát, có thể thất bại.

Báo cáo do cypress-mochawesome-reporter tạo trực tiếp trong `cypress/reports/`; không cần script merge cũ với công cụ chưa khai báo.
