# API Testing

[Project overview](../README.md) | [Manual Testing](../manual-testing/README.md) | [Automation Testing](../automation-testing/README.md)

## 1. Overview

API testing checks authentication, role permissions and clinic business behavior against the Express/MongoDB application. The Node suite contains **34 API tests plus 7 defect regression tests**. A separate Postman collection runs through Newman; its assertion count is reported separately.

## 2. API Coverage

| Group | Representative endpoints | Assertions exercised |
| --- | --- | --- |
| Authentication | POST `/auth/login`, GET `/auth/me` | Status, token/session behavior, role, password exclusion, missing/invalid/expired token rejection |
| Authorization | GET `/accounts`; GET/PATCH/DELETE `/invoices/:id` | Admin/Doctor/Reception permissions; forbidden mutations leave data unchanged |
| Booking/check-in | POST `/appointments`, PATCH `/appointments/:id/checkin` | Valid creation, past/duplicate booking rejection, time/status rules and stored checkInTime |
| Treatment state | PUT/PATCH `/appointments/:id`, PATCH `/appointments/:id/finish` | Progression, invalid transitions, repeated and concurrent completion |
| Invoices/payments | GET `/invoices?appointmentId=:id`, PATCH/DELETE `/invoices/:id` | Uniqueness, payment methods, received amount/debt, negative/insufficient payment, deletion permissions |

The [API contract and checklist](api-contract.md) records request requirements, expected responses and untested branches. Base URL: `http://localhost:5000/api`. This table describes tested assertions rather than complete endpoint/branch coverage.

## 3. Test Types

- **Positive:** valid login, booking, check-in, completion and payment persistence.
- **Negative:** missing credentials, invalid email/password, past/duplicate booking, invalid state transitions and negative/insufficient payment.
- **Authentication:** missing, invalid and signed-but-expired tokens; responses exclude passwords.
- **Authorization:** role-based allow/deny checks with stored-state verification after rejected mutations.
- **Business regression:** idempotent completion, 12 concurrent completion requests, invoice uniqueness and preservation of paid invoices.

Assertions check HTTP outcomes **and persisted business data** through subsequent GET requests. BUG-002 requires HTTP 400 plus unchanged completed status; BUG-003 requires exactly one invoice. Sending requests without checking results does not count as an automated test.

## 4. Test Framework

| Location | Responsibility |
| --- | --- |
| [automated-tests/](automated-tests/) | Node.js `node:test` / `node:assert/strict`: auth, permissions, appointments/invoices and defects |
| [postman/](postman/) | Importable collection, empty credential environment template, Newman package and lockfile |
| [Shared QA scripts](../.github/qa/README.md) | Run IDs, safe observations, TAP/JUnit/JSON and CSV/Excel reporting |
| [Fixture factory](../automation-testing/fixtures/qa-data.js) | Owned synthetic patient/doctor/service/shift data and cleanup |

Fixtures require loopback API/MongoDB and a database ending in `_test`. Setup may insert preconditions directly; business actions under test use HTTP. Credentials and tokens are excluded from committed environments and published response projections.

## 5. How to Run

Complete [project setup](../README.md#6-how-to-run-tests), start the API, then run from the repository root:

```sh
# API suite and defect regression; UI is not required
node --env-file=.env.test .github/qa/scripts/run-qa.js --suite=api

# Postman collection with isolated fixture data
npm ci --prefix api-testing/postman
node --env-file=.env.test .github/qa/scripts/run-postman.js
```

Newman receives credentials/fixture IDs in memory and cleans up owned data. For exploratory Postman use, import the collection/environment and prepare local QA credentials, IDs and valid shift/time data. Never commit an exported environment containing credentials.

Each execution creates a unique directory under `automation-testing/reports/generated/runs/`. Failed assertions, request/script failures and process failures produce a nonzero exit code. Defect tests remain active after a fix.

## 6. Test Results

| Evidence | Recorded result |
| --- | --- |
| [API TAP](../automation-testing/reports/runs/QA-20261113T124551346Z-2f0e1e/api/results.tap) / [JUnit](../automation-testing/reports/runs/QA-20261113T124551346Z-2f0e1e/api/junit.xml) | 34 Pass |
| [Defect TAP](../automation-testing/reports/runs/QA-20261113T124551346Z-2f0e1e/known-defects/results.tap) / [JUnit](../automation-testing/reports/runs/QA-20261113T124551346Z-2f0e1e/known-defects/junit.xml) | 7 Pass |
| [Execution JSON](../automation-testing/reports/runs/QA-20261113T124551346Z-2f0e1e/execution.json) | Per-test build, expected/actual, status and evidence; UI results are labeled separately |
| [Newman JSON](reports/newman/QA-20261113T124931337Z-ba424a/newman-results.json) | 21 requests; 46/46 assertions Pass; zero failures |
| [Verified CI run, 13 Nov 2026](https://github.com/htrsng/KiemThu_PhongKham/actions/runs/43438419642) | 34 API + 7 defect + 12 UI Pass; Newman 46 assertions Pass; artifact `clinic-qa-evidence` |

See the [report index](reports/README.md). Counts belong to individual recorded runs; do not sum historical/new runs or treat Newman assertions as additional independent manual cases.

## 7. Known Issues

The [registry](../manual-testing/bug-reports/registry.json) currently records **no Open API defects**. [BUG-002](../manual-testing/bug-reports/BUG-002.md) and [BUG-003](../manual-testing/bug-reports/BUG-003.md) were closed after verified retest; failing Before Fix evidence is retained.

Coverage gaps remain: doctor-specific ownership is not fully verified, the exact 30-minute check-in boundary is untested, and missing-field/invalid-ID error handling is not fully characterized. Split payment and the complete issued-invoice policy in the academic specification are not established as implemented/current-build Pass. These are documented gaps, not newly reproduced Open defects. See [API limitations](api-contract.md) and [source reconciliation](../docs/requirements/source-reconciliation.md).
