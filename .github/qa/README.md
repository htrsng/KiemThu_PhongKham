# Hạ tầng QA dùng chung

`scripts/` điều phối các suite, nhập tài liệu nguồn, audit báo cáo và cập nhật lifecycle. `helpers/` quản lý Run ID, CSV/Excel, HTTP observations và redaction. `unit/` kiểm tra tính đúng đắn của reporting/lifecycle. Test nghiệp vụ nằm ở `api-testing/automated-tests/` và `automation-testing/cypress/`.

Chạy từ thư mục gốc sau khi chuẩn bị theo [README](../../README.md):

```sh
node .github/qa/scripts/audit-qa.js
node --test .github/qa/unit/qa-reporting.test.js
node --env-file=.env.test .github/qa/scripts/run-qa.js
node --env-file=.env.test .github/qa/scripts/run-postman.js
```

Audit một run: `node .github/qa/scripts/audit-run.js <run-directory>`. Publish: `node --env-file=.env.test .github/qa/scripts/publish-run.js <Run-ID>`. Run đã công bố không được ghi đè. `.env.test` nằm ở gốc và bị Git bỏ qua; không commit file này.
