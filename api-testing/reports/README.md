# API Reports

See the [latest QA summary](../../manual-testing/test-execution/latest-qa-summary.md) for current results. The [expanded run](../../automation-testing/reports/runs/QA-20261113T153459634Z-3e9268/summary.md) recorded 35 API tests passed and 11 failed, with all 7 BUG-002/003 regression tests passed. The [Newman rerun](newman/QA-20261113T153601759Z-bf5a0c/newman-results.json) recorded 46 of 46 assertions passed. The entries below document runs before coverage expanded.

- The [verified full regression](../../automation-testing/reports/runs/QA-20261113T124551346Z-2f0e1e/summary.md) recorded 34 API tests and 7 defect regression tests passed. See the run's `api/` and `known-defects/` directories for TAP, JUnit, and observations.
- The [Postman/Newman run](newman/QA-20261113T124931337Z-ba424a/summary.md) recorded 21 requests and 46 assertions passed. The evidence excludes the environment and tokens.
- The [GitHub Actions verification](../../automation-testing/reports/ci-after-fix.json) identifies the CI commit that was verified.

Integrated API and UI results share a run ID under `automation-testing/reports/runs/`. Count each result once. New runtime output goes to the Git-ignored `automation-testing/reports/generated/`. Published Newman reports go to `api-testing/reports/newman/`, and published integrated reports go to `automation-testing/reports/runs/`.
