# Automation Testing - Cypress

[Project overview](../README.md) | [Manual Testing](../manual-testing/README.md) | [API Testing](../api-testing/README.md)

## 1. Overview

Cypress checks user-visible behavior against the running SmileCare frontend and backend. The suite contains **12 tests** covering login/session behavior, role navigation, reception check-in and invoice/payment interactions.

Some tests combine UI actions, API preconditions and API verification. The treatment stage of the BUG-004 workflow is performed through API requests: **check-in UI -> treatment API -> cash payment UI**. This is a hybrid workflow, not a claim that every action is full UI E2E.

## 2. Automated Scenarios

| Spec | Scenarios | Scope of checks |
| --- | --- | --- |
| [login.cy.js](cypress/e2e/login.cy.js) | Missing-session redirect; required fields; invalid email; wrong-password feedback; valid session | UI interactions and assertions, login response/current-account verification |
| [core-workflows.cy.js](cypress/e2e/core-workflows.cy.js) | Admin account page; Doctor/Reception restricted menu/API access | Navigation visibility plus HTTP authorization assertions |
| Same core spec | Reception check-in; invoice details; excessive-discount rejection | UI action/display checks, response status and persisted state or absence of a mutation |
| Same core spec - BUG-004 | Reception check-in, treatment completion, cash payment | UI/API hybrid; final GET verifies paymentMethod, amountPaid = finalAmount and debt = 0 |

The suite does not establish UI coverage for every academic use case. Payroll/revenue, split payment, QR/SMS and the entire doctor examination UI are outside the demonstrated current UI regression scope.

## 3. Framework Structure

```text
automation-testing/
  cypress.config.js       # Real backend, isolation, evidence/report hooks
  package.json            # Cypress and Mochawesome reporter dependencies
  cypress/
    e2e/                  # Login and business workflow specs
    pages/                # LoginPage page object
    support/              # Commands and reporter registration
  fixtures/qa-data.js      # Shared synthetic-data factory and cleanup
  reports/                # Published evidence and ignored runtime output
```

Tests use stable `data-testid` selectors, observable request aliases and business assertions. Retries are zero; there is no blanket exception suppression or fixed sleep used to disguise failures. The [configuration](cypress.config.js) enables video, failure screenshots and Mochawesome HTML/JSON reporting.

## 4. Test Data & Isolation

The [fixture factory](fixtures/qa-data.js) creates a separate doctor, patient, service, shift and appointment/invoice as required. Preconditions may be inserted directly; the action under test is performed through UI or HTTP as specified in the test.

Cypress test isolation is enabled, cookies/localStorage are cleared, and owned fixture data is cleaned up. Cleanup never drops the database. Fixture operations require loopback API/MongoDB and a database ending in `_test`. A forcibly terminated process may leave temporary data behind.

Credentials are loaded from ignored `.env.test`. API observations retain only selected business fields; do not publish tokens, passwords or real patient data in screenshots/logs.

## 5. How to Run

Complete [project setup](../README.md#6-how-to-run-tests) and start both API and frontend. Run from the repository root:

```sh
npm ci --prefix automation-testing

# Headless Cypress with Run ID and execution reporting
node --env-file=.env.test .github/qa/scripts/run-qa.js --suite=ui

# Full API + defect regression + Cypress run
node --env-file=.env.test .github/qa/scripts/run-qa.js

# Interactive Cypress UI for exploration/debugging
node --env-file=.env.test automation-testing/node_modules/cypress/bin/cypress open --project automation-testing
```

Use the headless QA runner for a finalized execution report. Interactive mode is for inspecting/running specs and is not a substitute for that report. If an IDE sets `ELECTRON_RUN_AS_NODE`, remove it before launching interactive Cypress; the headless QA runner removes it automatically. In PowerShell: `Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue`.

## 6. CI Integration

The [GitHub Actions workflow](../.github/workflows/cypress.yml) installs dependencies, starts MongoDB 7, audits designs, checks reporting/lifecycle, builds the frontend and starts API/UI services on Ubuntu with Node.js 24. It then runs API, defect regression, Cypress, evidence audit and Newman.

The job summary separates **Automation API + UI** from **Defect regression**. Any failed business assertion, skipped/unexecuted automated test or process error fails the QA runner. There is no `continue-on-error` bypass for known defects. Artifact upload runs even after test failure when evidence is available.

[Verified run after folder restructuring](https://github.com/htrsng/KiemThu_PhongKham/actions/runs/43438419642), 13 Nov 2026, commit `9b0a162`: Success, with 53 business tests Pass and 46 Newman assertions Pass. This identifies a recorded run, not a guarantee about future builds.

## 7. Test Results & Evidence

- [Published regression summary](reports/runs/QA-20261113T124551346Z-2f0e1e/summary.md): 12 UI tests Pass, separate from 34 API and 7 defect tests.
- [Execution JSON](reports/runs/QA-20261113T124551346Z-2f0e1e/execution.json) / [Excel](reports/runs/QA-20261113T124551346Z-2f0e1e/execution.xlsx): build, expected/actual, duration, status, case/bug links and evidence.
- [Check-in screenshot](reports/runs/QA-20261113T124551346Z-2f0e1e/ui/screenshots/core-workflows.cy.js/reception-checkin-persisted.png) / [invoice screenshot](reports/runs/QA-20261113T124551346Z-2f0e1e/ui/screenshots/core-workflows.cy.js/invoice-detail.png).
- [Report index](reports/README.md) and [run history](reports/runs/README.md): Before Fix, After Fix, regression and historical reporter limitations.

New runs write to `reports/generated/runs/<Run-ID>/`, ignored by Git. The CI artifact **clinic-qa-evidence** contains screenshots, videos, Mochawesome HTML/JSON and process logs; download it from the specific workflow run. Published Git snapshots include selected reports/screenshots, not all videos/HTML. Evidence within old runs is immutable; [legacy path mappings](reports/legacy-paths.json) explain relocated source paths.
