# API Testing

[Project overview](../README.md) | [Manual testing](../manual-testing/README.md) | [Test automation](../automation-testing/README.md)

## 1. Overview

API testing verifies authentication, authorization, and clinic workflows on the Express/MongoDB application. The Node suite includes **46 HTTP API tests and 7 regression tests for BUG-002/003**. The retest after fixes for BUG-005/006 recorded 46 API tests passed and 0 failed. All 7 defect regression tests passed. Postman and controller unit testing have separate reports. See the [latest QA summary](../manual-testing/test-execution/latest-qa-summary.md) for current recorded results.

## 2. API Scope

| Area | Example endpoints | Verified assertions |
| --- | --- | --- |
| Authentication | POST `/auth/login`, GET `/auth/me` | HTTP status, token and session behavior, role, password omission, and rejection of missing, invalid, or expired tokens |
| Authorization | GET `/accounts`, GET/PATCH/DELETE `/invoices/:id` | Permissions for Admin, Doctor, and Reception. Rejected updates leave stored data unchanged. |
| Doctor ownership | List and detail, PUT/PATCH, check-in, finish, DELETE, and reassignment restrictions | Three tests passed after the BUG-005 fix, including an allowed update to an appointment assigned to the doctor. |
| Booking and check-in | POST `/appointments`, PATCH `/appointments/:id/checkin` | Valid creation, rejection of past and duplicate appointments, timing and state rules, and persisted check-in time |
| Treatment state | PUT/PATCH `/appointments/:id`, PATCH `/appointments/:id/finish` | Forward transitions, rejection of invalid transitions, and repeated and concurrent completion |
| Invoices and payments | GET `/invoices?appointmentId=:id`, PATCH/DELETE `/invoices/:id` | Invoice uniqueness, payment method, amount collected, outstanding balance, negative or insufficient payment, and deletion permissions |
| Missing inputs and malformed IDs | POST with missing doctorId, patientId, startTime or endTime and malformed doctorId or startTime. GET/PATCH/check-in with malformed IDs. | Nine tests passed after the BUG-006 fix, confirming 4xx responses and no unintended data changes. |

The [API contract and checklist](api-contract.md) describe inputs, expected responses, and untested branches. The base URL is `http://localhost:5000/api`. The table lists the assertions covered by the suite. Other endpoints and branches remain outside that evidence.

## 3. Test Types

- **Positive cases** cover login, appointment creation, check-in, completion, and payment persistence.
- **Negative cases** cover missing credentials, invalid email or password, past or duplicate appointments, invalid transitions, and negative or insufficient payment.
- **Authentication** covers missing, invalid, and validly signed but expired tokens, plus password omission from responses.
- **Authorization** covers allow and deny decisions by role and read-back after rejected updates.
- **Business regression** covers idempotent completion, 12 concurrent completion requests, invoice uniqueness, and preservation of a paid invoice.

Six controller unit tests use a fixed clock and mocked persistence to verify exactly ±30 minutes and offsets of 1 ms. Run `node .github/qa/scripts/run-unit.js` for separate TAP and JUnit reports. Those tests are tracked separately from HTTP and manual execution.

Assertions verify HTTP responses **and persisted business data** through follow-up GET requests. BUG-002 requires HTTP 400 and an unchanged completed state. BUG-003 requires exactly one invoice. Automated test counts cover requests with assertions.

## 4. Tools and Suite Structure

| Location | Purpose |
| --- | --- |
| [automated-tests/](automated-tests/) | Node.js `node:test` and `node:assert/strict` for authentication, authorization, appointments, invoices, and defect regression |
| [postman/](postman/) | Importable collection, credential-free environment template, Newman package, and lockfile |
| [Shared QA scripts](../.github/qa/README.md) | Run IDs, redacted observations, and TAP, JUnit, JSON, CSV, and Excel reports |
| [Fixture builder](../automation-testing/fixtures/qa-data.js) | Synthetic patients, doctors, services, and shifts, with ownership tracking and cleanup |

Fixtures require loopback API and MongoDB services and a database name ending in `_test`. Tests may seed prerequisites directly. Business actions under test go through HTTP. Keep credentials and tokens out of committed environment files and published response data.

## 5. Running the Tests

Complete the [project setup](../README.md#5-running-the-tests), start the API, and run the following from the repository root.

```sh
# API and defect regression suites. Only the API needs to be running.
node --env-file=.env.test .github/qa/scripts/run-qa.js --suite=api

# Postman collection with dedicated test data
npm ci --prefix api-testing/postman
node --env-file=.env.test .github/qa/scripts/run-postman.js
```

Newman passes credentials and fixture IDs in memory and cleans up the data it owns afterward. For manual exploration in Postman, import the collection and environment and prepare local QA credentials, valid IDs, a shift, and an appointment time. Keep exported environments containing credentials out of Git.

Each run writes to a separate directory under `automation-testing/reports/generated/runs/`. Failed assertions, request or script errors, and process failures cause a nonzero exit. Keep defect regression tests in the suite after the fixes.

## 6. Results

The [46-test API catalog](reports/api-test-catalog.csv) and [defect and test case mapping](../manual-testing/bug-reports/bug-testcase-map.md) identify the test groups, source files, assertions, and evidence. The 46 runtime tests map to 33 design IDs. The seven known-defect tests run in their own suite.

| Evidence | Recorded result |
| --- | --- |
| [API TAP](../automation-testing/reports/runs/QA-20261114T164815189Z-178426/api/results.tap) / [JUnit](../automation-testing/reports/runs/QA-20261114T164815189Z-178426/api/junit.xml) | All 46 API tests passed |
| [Defect regression TAP](../automation-testing/reports/runs/QA-20261114T164815189Z-178426/known-defects/results.tap) / [JUnit](../automation-testing/reports/runs/QA-20261114T164815189Z-178426/known-defects/junit.xml) | All 7 defect regression tests passed |
| [Execution JSON](../automation-testing/reports/runs/QA-20261114T164815189Z-178426/execution.json) | Build, expected and actual results, status, and evidence per test, with UI results categorized separately |
| [Newman JSON](reports/newman/QA-20261114T164829754Z-c4f8d8/newman-results.json) | 21 requests, 46 of 46 assertions passed, and zero failures |
| [Recorded GitHub Actions run](https://github.com/htrsng/KiemThu_PhongKham/actions/runs/43617738189) | Success at commit `01a9c67`, including API, defect regression, Cypress, unit, build, and Newman checks |

See the [report index](reports/README.md). Interpret counts within each run. Newman assertions are counted independently of manual cases.

The [40-case priority workbook](../manual-testing/test-execution/manual-runs/MAN-20261114-01/manual-regression.xlsx) records **38 passed, 1 failed, and 1 blocked**. The [assisted API/UI suite](../manual-testing/test-execution/assisted-runs/README.md) has its own run and counts.

## 7. Known Defects and Limitations

[BUG-005](../manual-testing/bug-reports/BUG-005.md) and [BUG-006](../manual-testing/bug-reports/BUG-006.md) were closed after fixes in commit `1bb247a` and a retest with 46 of 46 API tests passed. Appointment ownership applies to listing, detail, PUT/PATCH, check-in, finish, and DELETE. The tests verify that another doctor's appointment remains unchanged and that a doctor can still update an assigned appointment. Missing and malformed inputs return 4xx before processing. The pre-fix evidence is preserved. The negative surcharge finding and the blocked case in the 40-case workbook remain outside this retest.

The recorded evidence covers the specific endpoints and branches above. Controller tests currently provide the evidence at exactly 30 minutes. Full HTTP, UI, and manual verification at that boundary is still open. Implementation and passing results for split payments and the full invoice policy remain unverified on the newer build. See the [API limitations](api-contract.md), [source reconciliation](../docs/requirements/source-reconciliation.md), and [latest QA summary](../manual-testing/test-execution/latest-qa-summary.md).
