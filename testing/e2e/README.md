# Cypress UI

Bộ đang duy trì gồm 5 test đăng nhập và 5 test vai trò/nghiệp vụ. Lần chạy 13/11/2026 đạt 10/10 trên Electron, retry = 0. [Bằng chứng](../../docs/qa/evidence/2026-11-13/README.md).

Sau khi chuẩn bị QA và khởi động API/UI theo [hướng dẫn](../../docs/qa/README.md), từ thư mục `testing/e2e` chạy:

```sh
node --env-file=../.env.test node_modules/cypress/bin/cypress run
node --env-file=../.env.test node_modules/cypress/bin/cypress run --spec cypress/e2e/login.cy.js
```

`npm run cy:open`, `cy:smoke`, `cy:run` cũng dùng được khi đã nạp biến môi trường vào shell. Cypress không tự đọc `.env.example` hoặc `.env.test`.

Nếu terminal IDE đặt `ELECTRON_RUN_AS_NODE=1`, bỏ biến đó trong terminal chạy Cypress. Với PowerShell:

```powershell
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
```

`core-workflows.cy.js` dùng Node task `qa:create` tạo dữ liệu tiền điều kiện với ID riêng; mỗi `afterEach` dọn dữ liệu do helper sở hữu. Luồng check-in thực hiện bằng nút trên giao diện, đợi request alias và GET lại trạng thái; invoice test kiểm tra patient, số tiền và trạng thái chưa thanh toán. Không chia sẻ appointment/invoice giữa các test, không dùng chờ thời gian cố định.

Hai lỗi nghiệp vụ API có suite riêng `testing/api/known-defects.test.js`; không che lỗi bằng retry hoặc đổi expected. Cypress hiện chưa tự động hóa thao tác thu tiền trên UI hoặc toàn bộ state transition.

HTML/JSON ở `cypress/reports/`, video ở `cypress/videos/`, screenshot ở `cypress/screenshots/`. Hai screenshot thành công phục vụ demo được tạo có chủ đích; khi Fail, Cypress tự chụp thêm ảnh. Raw artifacts không commit; chỉ chọn bằng chứng không chứa credential vào `docs/qa/evidence/`.
