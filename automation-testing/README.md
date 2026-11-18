# Test Automation with Cypress

[Project overview](../README.md) | [Manual testing](../manual-testing/README.md) | [API testing](../api-testing/README.md)

## 1. Overview

Cypress verifies user behavior against the running SmileCare frontend and backend. The suite contains **12 tests** covering login and sessions, role-based navigation, reception check-in, and invoice and payment interactions.

Some tests combine UI actions, API setup, and API read-back. The BUG-004 workflow uses **UI check-in → API treatment → UI cash payment**. Its evidence covers a hybrid workflow.

## 2. Automated Scenarios

See the [12-test catalog](reports/cypress-test-catalog.csv) and the [test and defect breakdown](../manual-testing/bug-reports/bug-testcase-map.md#5-giải-thích-đủ-12-cypress-test). The standard suite has five login tests, three RBAC tests, one check-in test, one invoice detail test, one discount validation test, and one hybrid workflow.

| Spec | Scenarios | Verification |
| --- | --- | --- |
| [login.cy.js](cypress/e2e/login.cy.js) | Redirect without a session, required fields, invalid email, incorrect password feedback, and a valid session | UI behavior, login response, and current account |
| [core-workflows.cy.js](cypress/e2e/core-workflows.cy.js) | Admin account page and menu/API restrictions for Doctor and Reception | Navigation visibility and HTTP authorization checks |
| Core workflows | Reception check-in, invoice detail, and rejection of an excessive discount | UI actions and display, HTTP status, and checks for persisted state or absent writes |
| Core workflows, BUG-004 | Check-in, treatment completion, and cash payment | Hybrid UI/API checks. The final GET verifies the payment method, `amountPaid = finalAmount`, and `debt = 0`. |

The verified UI regression scope excludes payroll, revenue, split payments, QR/SMS, and the full doctor examination UI.

## 3. Suite Structure

```text
automation-testing/
  cypress.config.js       # Live backend, isolation, and evidence/reporting hooks
  package.json            # Cypress and Mochawesome reporter dependencies
  cypress/
    e2e/                  # Login and business workflow specs
    pages/                # LoginPage page object
    support/              # Commands and reporter registration
  fixtures/qa-data.js      # Shared synthetic data setup and cleanup
  reports/                # Published evidence and Git-ignored runtime output
```

Tests use stable selectors such as `data-cy`, request aliases, and business assertions. Retries are set to zero. The suite avoids fixed waits and broad exception handlers that would hide failures. The [configuration](cypress.config.js) enables video, failure screenshots, and Mochawesome HTML/JSON reports.

## 4. Test Data and Isolation

The [fixture builder](fixtures/qa-data.js) creates dedicated doctors, patients, services, shifts, appointments, and invoices as needed. Tests can seed prerequisites directly. Each business action under test goes through the UI or HTTP as described in its spec.

Cypress test isolation clears cookies and local storage between tests. Cleanup removes only data owned by the process and leaves the database in place. Fixtures require loopback API and MongoDB services and a database name ending in `_test`. A forced stop can leave temporary data behind.

Credentials come from the Git-ignored `.env.test`. HTTP observations retain selected business fields. Keep tokens, passwords, and real patient data out of published screenshots and logs.

## 5. Running the Tests

Complete the [project setup](../README.md#5-running-the-tests) and start both the API and frontend. Run the following from the repository root.

```sh
npm ci --prefix automation-testing

# Headless Cypress with a run ID and execution report
node --env-file=.env.test .github/qa/scripts/run-qa.js --suite=ui

# Full API, defect regression, and Cypress run
node --env-file=.env.test .github/qa/scripts/run-qa.js

# Open Cypress interactively to explore and debug
node --env-file=.env.test automation-testing/node_modules/cypress/bin/cypress open --project automation-testing
```

Use the headless QA runner for a complete execution report. Use interactive mode to inspect and debug specs. If your IDE sets `ELECTRON_RUN_AS_NODE`, clear it before opening Cypress interactively. The headless runner clears it automatically. In PowerShell, use `Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue`.

## 6. CI Integration

The [GitHub Actions workflow](../.github/workflows/cypress.yml) installs dependencies, starts MongoDB 7, audits test design, checks reporting and defect lifecycle, builds the frontend, and starts the API and UI on Ubuntu with Node.js 24. It then runs API, defect regression, Cypress, evidence audit, and Newman checks.

The job summary has separate **Automation API + UI** and **Defect regression** results. Failed business assertions, expected tests that are skipped or omitted, and process failures cause the runner to fail. Known failures remain subject to the same gate. Artifact upload can still run after a failure when evidence is available.

The [GitHub Actions record](https://github.com/htrsng/KiemThu_PhongKham/actions/runs/43617738189) shows Success at commit `01a9c67` for documentation checks, unit tests, build, API/Cypress, evidence audit, and Newman. The local retest at `1bb247a` recorded **65 passed and 0 failed**, including **12 Cypress tests passed**. The treatment step uses the token of the doctor assigned to the fixture appointment. See the [current summary](../manual-testing/test-execution/latest-qa-summary.md) and historical runs for post-fix and pre-fix evidence.

## 7. Results and Evidence

The [40-case priority workbook](../manual-testing/test-execution/manual-runs/MAN-20261114-01/manual-regression.xlsx) records **38 passed, 1 failed, and 1 blocked**. Its assisted spec is `cypress/assisted/priority-40.cy.js`, outside the standard 12-test glob. The [assisted execution notes](../manual-testing/test-execution/assisted-runs/README.md) explain why Cypress recorded 39 passed and 1 failed, while the workbook has one blocked case due to a timing limitation.

- The [published regression summary](reports/runs/QA-20261114T164815189Z-178426/summary.md) records 12 UI tests passed, 46 API tests passed, and 7 BUG-002/003 regression tests passed in separate groups.
- The [execution JSON](reports/runs/QA-20261114T164815189Z-178426/execution.json) and [Excel workbook](reports/runs/QA-20261114T164815189Z-178426/execution.xlsx) record build, expected and actual results, duration, status, case and defect IDs, and evidence.
- The run includes a [check-in screenshot](reports/runs/QA-20261114T164815189Z-178426/ui/screenshots/core-workflows.cy.js/reception-checkin-persisted.png) and an [invoice screenshot](reports/runs/QA-20261114T164815189Z-178426/ui/screenshots/core-workflows.cy.js/invoice-detail.png).
- The [report index](reports/README.md) and [run history](reports/runs/README.md) document pre-fix, post-fix, and regression runs, including historical reporter limitations.

New runs write to the Git-ignored `reports/generated/runs/<Run-ID>/`. The **clinic-qa-evidence** CI artifact contains screenshots, video, Mochawesome HTML/JSON, and process logs. Download it from the corresponding workflow run. Git contains selected reports and screenshots. Existing evidence is preserved. The [legacy path mapping](reports/legacy-paths.json) identifies moved source locations.
