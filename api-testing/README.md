# API testing

`automated-tests/` chứa 34 API tests và 7 defect regression tests. `postman/` chứa collection/environment trống thông tin đăng nhập, package và lockfile Newman. [API contract](api-contract.md) mô tả request, quyền, oracle và giới hạn đã biết.

Chuẩn bị MongoDB và API theo [README gốc](../README.md). Từ thư mục gốc:

```sh
node --env-file=.env.test .github/qa/scripts/run-qa.js --suite=api
npm ci --prefix api-testing/postman
node --env-file=.env.test .github/qa/scripts/run-postman.js
```

Fixture dùng dữ liệu giả riêng, chỉ chấp nhận loopback và DB kết thúc `_test`. Không export token/password. Mọi request/script/assertion thất bại làm runner trả nonzero.

[Reports](reports/README.md) nối tới TAP/JUnit/HTTP observations trong các run tích hợp và [kết quả Newman](reports/newman/QA-20261113T124931337Z-ba424a/newman-results.json): 21 requests, 46 assertions Pass. Đây là kết quả đã chạy trước khi đổi cấu trúc; mỗi lần chạy mới có Run ID/build riêng, không ghi đè báo cáo cũ.
