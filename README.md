# SmileCare - Software Testing Portfolio

[![Clinic QA Checks](https://github.com/htrsng/KiemThu_PhongKham/actions/workflows/cypress.yml/badge.svg)](https://github.com/htrsng/KiemThu_PhongKham/actions/workflows/cypress.yml)

## 1. Project Overview

SmileCare is an academic dental clinic management system built with React/TypeScript, Express and MongoDB. This repository presents its QA work for a **Software Tester Intern portfolio**: requirements analysis, test design, historical execution records, defect reports, API checks and Cypress regression.

The application in `client/` and `server/` is the system under test. Testing materials are organized into `manual-testing/`, `api-testing/` and `automation-testing/`.

## 2. My QA Responsibilities

My assigned QA responsibilities in the academic group project included test planning, test case design, manual/website testing and automation. This portfolio documents that work and subsequent maintenance:

- Review requirements and design positive/negative cases using EP, BVA, decision tables and state transitions.
- Preserve academic execution records with traceability to their original sources.
- Document reproducible defects with severity, priority, expected/actual results and evidence.
- Maintain API/Cypress regression, persisted-state assertions and Before Fix / After Fix records.
- Prepare a priority manual regression suite; its new-build execution is **still pending**.

The attribution and AI-assisted portfolio additions are explained in [Project Background](#7-project-background).

## 3. Testing Scope

| Area | Demonstrated scope |
| --- | --- |
| Authentication and RBAC | Login/session validation; Admin/Doctor/Reception access checks |
| Appointments and check-in | Booking constraints, check-in time/status, appointment transitions and repeated completion |
| Invoices and payments | Invoice uniqueness, payment methods, received amount/debt and rejected payment mutations |
| Academic baseline | 20 use cases, also including catalogs, revenue and payroll; historical results do not establish current-build coverage |

Cypress includes hybrid UI/API workflows. The current suite does not verify every academic feature or every UI step. See each specialist README for coverage boundaries.

## 4. Testing Documentation

| Track | What to review |
| --- | --- |
| [Manual Testing](manual-testing/README.md) | Test plan, scenarios, techniques, 337 original/70 focused cases, execution, defect reports and RTM |
| [API Testing](api-testing/README.md) | Endpoints, positive/negative/auth checks, business assertions, Postman/Newman and reports |
| [Automation Testing](automation-testing/README.md) | Cypress scenarios, framework, data isolation, UI/API boundaries, CI and evidence |

The [specification](docs/requirements/LT2_N02_DacTa.pdf) and [academic records](docs/academic/) retain source context. Shared runner/reporting utilities live in `.github/qa/`. [CONTRIBUTING.md](CONTRIBUTING.md) defines evidence and defect-management rules.

## 5. Test Execution Results

| Record | Result | Source |
| --- | --- | --- |
| Original Excel, last-tested sheet note 14 June 2026 | 337 cases / 20 use cases; 337 recorded Pass | [Historical execution workbook](manual-testing/test-execution/history/manual-execution.xlsx) |
| Original PDF summary | 314 cases: 288 Pass / 26 Fail | [Academic report, page 36](docs/academic/LT2_N02_KiemThu.pdf#page=36) |
| Automated business regression | 34 API + 12 UI + 7 defect tests: **53 Pass, 0 Fail** | [Execution JSON](automation-testing/reports/runs/QA-20261113T124551346Z-2f0e1e/execution.json) |
| Postman collection via Newman | 21 requests; **46/46 assertions Pass** | [Newman JSON](api-testing/reports/newman/QA-20261113T124931337Z-ba424a/newman-results.json) |
| Priority manual retest on the new build | 40 cases: **Not Run** | [Execution template](manual-testing/test-execution/manual-regression.xlsx) |

[CI verification after restructuring](https://github.com/htrsng/KiemThu_PhongKham/actions/runs/43438419642), commit `9b0a162`, independently confirms 53 business tests and 46 Newman assertions Pass. BUG-002/003/004 have verified fix/retest evidence in the [bug register](manual-testing/bug-reports/README.md).

Excel and PDF counts are separate historical records; their differences are explained in [source reconciliation](docs/requirements/source-reconciliation.md). The 70 focused designs overlap the 337 originals, and the 40-case manual suite is a subset. Neither design counts nor automated assertions are additional manual Pass results.

## 6. How to Run Tests

Prerequisites: Node.js 24, npm and local MongoDB on port 27017. Run commands from the repository root:

```sh
npm ci --prefix server
npm ci --prefix client
npm ci --prefix automation-testing
npm ci --prefix api-testing/postman
```

On a fresh checkout, generate the ignored QA environment once and seed synthetic accounts. Reuse an existing `.env.test` for subsequent runs; the generator replaces it.

```sh
node .github/qa/scripts/prepare-env.js
node --env-file=.env.test .github/qa/scripts/seed-test-accounts.js
```

Start API and frontend in separate terminals:

```sh
node --env-file=.env.test server/server.js
```

```sh
npm --prefix client run dev
```

With both services running:

```sh
node .github/qa/scripts/audit-qa.js
node --env-file=.env.test .github/qa/scripts/run-qa.js
node --env-file=.env.test .github/qa/scripts/run-postman.js
```

Any failed business test or unexecuted automated test fails the QA run; defect tests are not bypassed. For API-only, Cypress UI/headless and manual execution instructions, use the three specialist READMEs above. Fixture operations require loopback services and a database ending in `_test`.

## 7. Project Background

This project originated as group coursework. The [academic test report](docs/academic/LT2_N02_KiemThu.pdf#page=2) assigns Nguyen Thi Huyen Trang QA responsibilities; application implementation and academic results include group contributions. The client/server code is retained for reproducibility and is not presented as software developed entirely by one person.

Subsequent source normalization, automation/reporting improvements and defect fixes were AI-assisted. Original academic files and published execution evidence are preserved; current-build results carry their own Run IDs/builds. Historical results are not relabeled as a new manual execution.
