# SmileCare — Software Testing Portfolio

[![QA Checks](https://github.com/htrsng/KiemThu_PhongKham/actions/workflows/cypress.yml/badge.svg)](https://github.com/htrsng/KiemThu_PhongKham/actions/workflows/cypress.yml)

## 1. Project Overview

SmileCare is a dental clinic management system for patients, dentists, services, appointments, reception, treatment, and payments. Administrators, dentists, and receptionists have role-based access to their respective workflows.

The main workflow covers appointment booking, check-in, treatment status updates, invoice generation, and payment recording. The application uses React and TypeScript for the frontend, Express for the API, and MongoDB for data storage.

## 2. Test Scope

| Feature area | Scope supported by test evidence |
| --- | --- |
| Authentication and authorization | Login and session handling, plus permissions for Admin, Doctor, and Reception |
| Appointments and check-in | Booking rules, check-in timing and status, treatment state transitions, and repeated completion |
| Invoices and payments | Invoice uniqueness, payment methods, amounts paid, outstanding balances, and rejection of invalid updates |
| Previously tested features | Results from an earlier run covering 20 use cases, including master data, revenue, and payroll |

Cypress covers workflows that combine UI actions with API checks. The current regression suite focuses on the workflows above. Each testing guide describes its scope and limitations.

## 3. Testing Documentation

| Area | Contents |
| --- | --- |
| [Manual testing](manual-testing/README.md) | Test plan, scenarios, design techniques, 337 historical cases, 70 focused cases, execution records, defect reports, and requirements traceability |
| [API testing](api-testing/README.md) | Endpoints, positive and negative cases, authentication, authorization, assertions, Postman/Newman, and reports |
| [Test automation](automation-testing/README.md) | Cypress scenarios, suite structure, isolated test data, UI/API coverage, CI, and evidence |

The [requirements specification](docs/requirements/LT2_N02_DacTa.pdf) and [original project documents](docs/academic/) provide source material for comparison. Shared test and reporting scripts are in `.github/qa/`. [CONTRIBUTING.md](CONTRIBUTING.md) describes how to manage evidence and defects.

The [defect-to-test mapping](manual-testing/bug-reports/bug-testcase-map.md) links six defects to test cases and scripts, explains their status, severity and priority, and documents how the 46 API tests and 12 Cypress tests are counted.

## 4. Test Execution Results

See the [latest QA summary](manual-testing/test-execution/latest-qa-summary.md) for current recorded results. The local retest after fixes for BUG-005 and BUG-006 recorded **65 passed and 0 failed**, covering 46 API tests, 12 Cypress UI/hybrid tests, and 7 regression tests for BUG-002 and BUG-003. The defect registry records all six registered defects as Closed, with supporting evidence. Pre-fix reports are preserved.

| Test group | Recorded results | Evidence |
| --- | --- | --- |
| Historical functional testing | **337 test cases across 20 use cases, all recorded as passed** | [Excel execution results](manual-testing/test-execution/history/manual-execution.xlsx) |
| Automated regression with Node API tests and Cypress | **65 passed, 0 failed** across 46 Node API tests, 12 Cypress UI/hybrid tests, and 7 defect regression tests | [Regression report](automation-testing/reports/runs/QA-20261114T164815189Z-178426/execution.json) |
| Controller and QA tooling unit tests | **19 passed**, including 6 check-in boundary tests and 13 reporting and defect lifecycle tests | [Unit test report](automation-testing/reports/runs/QA-20261114T164835731Z-7ba849/unit-results.json) |
| Postman/Newman API testing | **21 requests, 46 of 46 assertions passed** | [Newman report](api-testing/reports/newman/QA-20261114T164829754Z-c4f8d8/newman-results.json) |
| Priority regression workbook | **38 passed, 1 failed, 1 blocked** across 40 cases | [Excel execution results](manual-testing/test-execution/manual-runs/MAN-20261114-01/manual-regression.xlsx) |

[GitHub Actions run 43617738189](https://github.com/htrsng/KiemThu_PhongKham/actions/runs/43617738189) is recorded as successful at commit `01a9c67`. The workflow passed the documentation audit, unit tests, frontend build, API and Cypress suites, evidence audit, and Newman checks. The [defect tracker](manual-testing/bug-reports/README.md) documents the Fixed → Retest → Closed progression and preserves both pre-fix and post-fix evidence for BUG-005 and BUG-006.

**Test inventories.** The historical Excel workbook records 337 functional cases across 20 use cases. The [70 focused cases](manual-testing/test-cases/test-cases.csv) form the current regression design and overlap with the historical cases. The [40 priority cases](manual-testing/test-cases/regression-suite.csv) are a subset selected from those 70 and have their own execution workbook. Use the phrase **70-case regression design** when describing this scope.

**Defect retesting.** The historical 337 passes come from the earlier Excel workbook. The [registry](manual-testing/bug-reports/registry.json) documents the discovery and evidence for each of the six defects, including the historical status imported for BUG-001. The 65-test automated run provides post-fix evidence for BUG-005 and BUG-006. Evidence for a rerun of all 337 historical cases after all six fixes is unavailable.

**Counting results.** Node counts individual automated tests. Newman counts requests and their individual assertions. The suites overlap in business coverage, so summing their counts would overstate the number of distinct scenarios. Controller unit tests use mocked persistence. Cypress includes workflows that combine UI actions and API verification.

The 40-case workbook records `TC-PAY-016` as Failed because payment completed with a negative surcharge. It records `TC-APPT-014` as Blocked because exact equality between the check-in time and the appointment start time was not verified. The [assisted API/UI results](manual-testing/test-execution/assisted-runs/README.md) have a separate evidence record. The workbook linked in the table contains the recorded run results. `manual-regression.xlsx` in the parent execution directory is the reusable template.

## 5. Running the Tests

You need Node.js 24, npm, and a local MongoDB instance on port 27017. Run the following commands from the repository root.

```sh
npm ci --prefix server
npm ci --prefix client
npm ci --prefix automation-testing
npm ci --prefix api-testing/postman
```

On a fresh checkout, generate the QA environment and seed the test accounts. Reuse the existing `.env.test` for later runs. The environment generation command overwrites that file.

```sh
node .github/qa/scripts/prepare-env.js
node --env-file=.env.test .github/qa/scripts/seed-test-accounts.js
```

Start the API and frontend in separate terminals.

```sh
node --env-file=.env.test server/server.js
```

```sh
npm --prefix client run dev
```

Once both services are running, run the audits and test suites.

```sh
node .github/qa/scripts/audit-qa.js
node .github/qa/scripts/run-unit.js
node --env-file=.env.test .github/qa/scripts/run-qa.js
node --env-file=.env.test .github/qa/scripts/run-postman.js
```

The QA runner exits with an error if a business test fails or an expected automated test does not run. Defect regression tests are included in the full run. The testing guides cover standalone API runs, interactive and headless Cypress runs, and manual execution. The test data tools require loopback services and a database name ending in `_test`.
