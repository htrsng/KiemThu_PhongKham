# API reports

- [Full regression đã xác minh](../../automation-testing/reports/runs/QA-20261113T124551346Z-2f0e1e/summary.md): API 34 Pass, defect regression 7 Pass; TAP/JUnit và observations nằm trong `api/`, `known-defects/` của run.
- [Postman/Newman](newman/QA-20261113T124931337Z-ba424a/summary.md): 21 requests, 46 assertions Pass; không lưu environment/token trong evidence.
- [Xác minh GitHub Actions](../../automation-testing/reports/ci-after-fix.json) ghi đúng commit CI đã kiểm chứng.

Run tích hợp giữ API/UI cùng một Run ID tại `automation-testing/reports/runs/`, không nhân bản số Pass giữa hai nhóm. Runtime output mới nằm trong `automation-testing/reports/generated/` (Git ignored); khi publish, Newman vào `api-testing/reports/newman/`, các run tích hợp vào `automation-testing/reports/runs/`.
