# Bằng chứng thực thi — 13/11/2026

Lần chạy cục bộ trên Windows, Node.js 22.15.0, MongoDB 8.2.3 local riêng `_test`, Cypress 15.17.0 / Electron 138 headless, timezone Asia/Saigon. Thời gian máy đọc trong manifest là UTC (cộng 7 giờ để đối chiếu giờ Việt Nam). CI dùng MongoDB 7 và Node.js 24; chưa có run mới để đối chiếu hai môi trường.

Nguồn: working tree dựa trên commit `68a2e6ae63961e04aedc995a30319fa4912231fb`; không phải nguyên trạng commit đó. Hash SHA-256 trong các manifest và `source-hashes.json` giúp đối chiếu đúng file đã chạy. Tài liệu được cập nhật sau khi chạy; hash chỉ mô tả các file nguồn được liệt kê.

| File | Nguồn / ý nghĩa |
| --- | --- |
| [api-results.tap](api-results.tap), [api-junit.xml](api-junit.xml) | Node test runner xuất trực tiếp: 26 Pass, 0 Fail |
| [api-manifest.json](api-manifest.json) | Thời điểm, Node, base commit, hash test/helper và số liệu parse từ TAP |
| [known-defects-results.tap](known-defects-results.tap), [JUnit](known-defects-junit.xml) | Hai requirement assertions Fail; log actual/expected cho BUG-002/003 |
| [known-defects-manifest.json](known-defects-manifest.json) | Manifest riêng, exit code 1; không cộng vào regression Pass |
| [cypress-results.json](cypress-results.json) | Trích stats, tên, trạng thái và thời gian từ Mochawesome JSON thật; 10 Pass |
| [source-hashes.json](source-hashes.json) | Hash spec/config/helper và mã ứng dụng liên quan |
| [Check-in](reception-checkin-persisted.png), [Invoice](invoice-detail.png) | Screenshot Cypress chụp sau assertion thành công; chỉ dữ liệu QA tổng hợp |

## Lệnh đã chạy

```sh
npm run build --prefix client
node --env-file=testing/.env.test testing/scripts/seed-test-accounts.js
node --env-file=testing/.env.test testing/scripts/run-api.js
node --env-file=testing/.env.test testing/scripts/run-api.js --known-defects
```

Trong `testing/e2e`:

```sh
node --env-file=../.env.test node_modules/cypress/bin/cypress run
```

Build frontend Pass, 2.942 modules được transform. Có cảnh báo bundle lớn và Browserslist cũ; không phải lỗi kiểm thử. Raw build output chưa được lưu trong gói evidence này. Cypress không retry và không có pending/skipped. HTML report/video giữ ở thư mục artifact cục bộ bị Git bỏ qua; JSON ở đây là bản trích số liệu, không phải toàn bộ HTML report.

File được chọn bằng `testing/scripts/snapshot-evidence.js 2026-11-13`, kiểm tra không có password/JWT trong text; hai ảnh đã được xem lại. Không có kết quả manual hoặc Postman runner trong lần chạy. Không dùng evidence này làm bằng chứng CI mới hoặc tương thích nhiều browser.
