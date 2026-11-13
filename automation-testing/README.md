# Kiểm thử tự động — Cypress

[Tổng quan dự án](../README.md) | [Kiểm thử thủ công](../manual-testing/README.md) | [Kiểm thử API](../api-testing/README.md)

## 1. Tổng quan

Cypress kiểm tra hành vi người dùng trên frontend và backend SmileCare đang chạy. Bộ gồm **12 test** về đăng nhập/phiên làm việc, điều hướng theo vai trò, check-in tại quầy và tương tác hóa đơn/thanh toán.

Một số test kết hợp thao tác UI, tiền điều kiện API và kiểm tra lại bằng API. Giai đoạn điều trị trong luồng BUG-004 dùng request API: **check-in UI → điều trị API → thanh toán tiền mặt UI**. Đây là luồng kết hợp, không khẳng định mọi hành động đều qua giao diện như một luồng UI E2E đầy đủ.

## 2. Kịch bản đã tự động hóa

| Spec | Kịch bản | Phạm vi xác minh |
| --- | --- | --- |
| [login.cy.js](cypress/e2e/login.cy.js) | Chuyển hướng khi thiếu phiên; trường bắt buộc; email sai; phản hồi sai mật khẩu; phiên hợp lệ | Thao tác/assertions UI, response đăng nhập và tài khoản hiện tại |
| [core-workflows.cy.js](cypress/e2e/core-workflows.cy.js) | Trang tài khoản Admin; giới hạn menu/API của Doctor và Reception | Hiển thị điều hướng và assertions phân quyền HTTP |
| Cùng core spec | Check-in của Reception; chi tiết hóa đơn; từ chối giảm giá vượt mức | Thao tác/hiển thị UI, HTTP status, trạng thái đã lưu hoặc không phát sinh cập nhật |
| Cùng core spec — BUG-004 | Check-in, hoàn thành điều trị, thu tiền mặt | Kết hợp UI/API; GET cuối kiểm tra paymentMethod, amountPaid = finalAmount và debt = 0 |

Bộ này chưa xác nhận coverage UI cho mọi use case học phần. Tiền lương/doanh thu, thanh toán kết hợp, QR/SMS và toàn bộ giao diện khám của bác sĩ nằm ngoài phạm vi hồi quy UI hiện đã chứng minh.

## 3. Cấu trúc bộ kiểm thử

```text
automation-testing/
  cypress.config.js       # Backend thật, isolation và hooks thu bằng chứng/báo cáo
  package.json            # Thư viện Cypress và Mochawesome reporter
  cypress/
    e2e/                  # Spec đăng nhập và luồng nghiệp vụ
    pages/                # Page object LoginPage
    support/              # Commands và đăng ký reporter
  fixtures/qa-data.js      # Tạo dữ liệu giả dùng chung và cleanup
  reports/                # Bằng chứng đã công bố và đầu ra chạy bị Git bỏ qua
```

Test dùng selector `data-testid` ổn định, alias theo dõi request và assertions nghiệp vụ. Retry bằng 0; không nuốt exception chung hoặc dùng chờ cố định để che lỗi. [Cấu hình](cypress.config.js) bật video, ảnh khi test lỗi và báo cáo HTML/JSON Mochawesome.

## 4. Dữ liệu kiểm thử và tính độc lập

[Bộ tạo fixture](fixtures/qa-data.js) tạo riêng bác sĩ, bệnh nhân, dịch vụ, ca trực và lịch hẹn/hóa đơn khi cần. Tiền điều kiện có thể được thêm trực tiếp; hành động cần kiểm tra đi qua UI hoặc HTTP đúng như spec mô tả.

Cypress bật test isolation, xóa cookie/localStorage và dọn dữ liệu do process sở hữu. Cleanup không drop database. Fixture yêu cầu API/MongoDB loopback và database kết thúc bằng `_test`. Dừng cưỡng bức process có thể để lại dữ liệu tạm.

Thông tin đăng nhập lấy từ `.env.test` bị Git bỏ qua. HTTP observations chỉ giữ các trường nghiệp vụ được chọn; không công bố token, mật khẩu hoặc dữ liệu bệnh nhân thật trong ảnh/log.

## 5. Hướng dẫn chạy

Hoàn thành [cài đặt dự án](../README.md#5-hướng-dẫn-chạy-kiểm-thử), mở cả API và frontend. Chạy từ thư mục gốc:

```sh
npm ci --prefix automation-testing

# Cypress headless, có Run ID và báo cáo thực thi
node --env-file=.env.test .github/qa/scripts/run-qa.js --suite=ui

# Toàn bộ API, hồi quy lỗi và Cypress
node --env-file=.env.test .github/qa/scripts/run-qa.js

# Mở Cypress có giao diện để khám phá/debug
node --env-file=.env.test automation-testing/node_modules/cypress/bin/cypress open --project automation-testing
```

Dùng QA runner headless để tạo báo cáo thực thi hoàn chỉnh. Chế độ có giao diện phục vụ xem/chạy spec, không thay thế báo cáo đó. Nếu IDE đặt `ELECTRON_RUN_AS_NODE`, hãy xóa biến trước khi mở Cypress có giao diện; runner headless tự bỏ biến này. Trong PowerShell: `Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue`.

## 6. Tích hợp CI

[Workflow GitHub Actions](../.github/workflows/cypress.yml) cài thư viện, mở MongoDB 7, audit thiết kế, kiểm tra reporting/lifecycle, build frontend và khởi động API/UI trên Ubuntu với Node.js 24. Sau đó chạy API, hồi quy lỗi, Cypress, audit bằng chứng và Newman.

Job summary tách **Automation API + UI** và **Defect regression**. Assertion nghiệp vụ Fail, test tự động bị bỏ qua/chưa chạy hoặc lỗi process đều làm QA runner thất bại. Không dùng `continue-on-error` để bỏ qua lỗi đã biết. Upload artifact vẫn chạy sau test Fail khi có bằng chứng.

[CI đã xác minh bộ mở rộng](https://github.com/htrsng/KiemThu_PhongKham/actions/runs/43455436873), head `420cc74`: Failed do 11 assertions của BUG-005/006 trong API; Cypress vẫn 12 Pass. Unit/build/audit evidence và Newman đạt. [Tổng hợp hiện hành](../manual-testing/test-execution/latest-qa-summary.md) ghi rõ 54 Pass / 11 Fail và metadata CI. Không dùng riêng Cypress Pass để kết luận cả build đạt.

## 7. Kết quả và bằng chứng

- [Tổng hợp hồi quy đã công bố](reports/runs/QA-20261113T153459634Z-3e9268/summary.md): 12 UI Pass, tách khỏi API 35 Pass / 11 Fail và 7 test hồi quy BUG-002/003 Pass.
- [JSON thực thi](reports/runs/QA-20261113T153459634Z-3e9268/execution.json) / [Excel](reports/runs/QA-20261113T153459634Z-3e9268/execution.xlsx): build, expected/actual, thời gian, trạng thái, case/bug và bằng chứng.
- [Ảnh check-in](reports/runs/QA-20261113T153459634Z-3e9268/ui/screenshots/core-workflows.cy.js/reception-checkin-persisted.png) / [ảnh hóa đơn](reports/runs/QA-20261113T153459634Z-3e9268/ui/screenshots/core-workflows.cy.js/invoice-detail.png).
- [Chỉ mục báo cáo](reports/README.md) và [lịch sử các run](reports/runs/README.md): trước sửa, sau sửa, hồi quy và các giới hạn reporter lịch sử.

Run mới ghi vào `reports/generated/runs/<Run-ID>/`, bị Git bỏ qua. Artifact CI **clinic-qa-evidence** chứa ảnh, video, HTML/JSON Mochawesome và log process; tải từ đúng workflow run. Bản công bố trong Git chỉ chọn báo cáo/ảnh, không chứa toàn bộ video/HTML. Nội dung evidence của run cũ được giữ nguyên; [bảng ánh xạ đường dẫn](reports/legacy-paths.json) giải thích các vị trí nguồn đã chuyển.
