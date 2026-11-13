# Manual Testing

[Project overview](../README.md) | [API Testing](../api-testing/README.md) | [Automation Testing](../automation-testing/README.md)

## 1. Overview

Manual testing turns SmileCare's clinic requirements into scenarios, test cases, execution records and reproducible defect reports. The academic baseline covers 20 use cases across catalogs, scheduling, reception/treatment, payments, revenue and payroll. Current regression planning prioritizes authentication, role permissions, appointments/check-in and invoices/payments.

Start with the [test plan](test-plan/test-plan.md) and [scenario catalog](test-scenarios/scenarios.md). Design coverage, academic execution and current-build retesting are recorded separately.

## 2. Test Design Techniques

| Technique | Application | Design examples |
| --- | --- | --- |
| Equivalence Partitioning (EP) | Valid/invalid email; insufficient payment with/without debt permission | TC-AUTH-003, TC-PAY-007/008 |
| Boundary Value Analysis (BVA) | Check-in time limits, minimum password length, 100% discount, negative surcharge | TC-AUTH-006, TC-APPT-011 to 014, TC-PAY-012/016 |
| Decision Table | Fixed/percentage discount combined with a surcharge | TC-PAY-013/014 |
| State Transition | Valid appointment progression; invalid backward/cancellation transitions | TC-APPT-016 to 021 |
| Error Guessing | Repeated completion and duplicate invoice side effects | TC-APPT-022 / BUG-003 |

These are **design examples**, not evidence that every example was executed on the current build. The exact 30-minute check-in boundary remains unverified; automation exercises 29 minutes early, 31 minutes late and the current time.

## 3. Test Case Inventory

| Inventory | Purpose | Execution interpretation |
| --- | --- | --- |
| [337 original cases](test-cases/source-cases.csv) / 20 use cases | Normalized academic workbook with source sheet/row and original results | Original Excel records 337 Pass; historical execution, not current-build retest |
| [70 focused cases](test-cases/test-cases.csv) | Supplementary regression designs with steps, data, expected results, priority and technique | Selected assertions are automated; the full inventory is not manually retested |
| [40-case priority suite](test-cases/regression-suite.csv) | Subset covering Auth/RBAC, appointments/check-in, payments and BUG-002/003/004 | **Not Run** on the current build until a tester records an actual execution |

The 70 focused cases overlap the original 337: **do not count them as 407 independent scenarios**. The 40-case suite is a subset, not an additional inventory. Partial automation coverage does not establish a complete manual Pass.

Four missing design fields were completed through a [correction overlay](test-cases/source-corrections.json), preserving original files, historical status and missing historical Actual fields. [Source reconciliation](../docs/requirements/source-reconciliation.md) also explains the separate PDF summary: 314 cases, 288 Pass / 26 Fail. The chronology of the Excel and PDF results is not established.

## 4. Test Execution

Use the [40-case execution workbook](test-execution/manual-regression.xlsx) and [execution guide](test-execution/manual-regression.md). The [general workbook](test-execution/test-execution.xlsx) is retained separately.

1. Save a new copy for each Run ID. Record build commit, environment/browser, executor and actual date/time.
2. Prepare synthetic data and record the patient/appointment/invoice IDs used. Perform the documented steps against that build.
3. Compare observations with **Expected**. Record the real message, HTTP status, persisted state, invoice count or balance in **Actual**, with screenshots or sanitized responses.
4. Mark **Pass** after observing the expected result; **Fail** for a mismatch; **Blocked** with the missing prerequisite/feature; leave untouched cases **Not Run**. Add a Bug ID when relevant.

Academic results are available as [Excel](test-execution/history/manual-execution.xlsx) and [CSV](test-execution/history/manual-execution.csv). Missing source metadata remains explicitly unrecorded. Never copy automated outcomes into manual fields or replace missing historical Actual with Expected.

The [execution report](test-execution/test-report.md) separates historical and automated runs. The 40-case manual retest is still pending; the project does not claim a new manual run across all 337 cases.

## 5. Defect Management

The [bug register](bug-reports/README.md) links preconditions, reproduction steps, expected/actual behavior, severity, priority and evidence. The [machine-readable registry](bug-reports/registry.json) records lifecycle events.

| Defect | Behavior | Verified disposition |
| --- | --- | --- |
| [BUG-002](bug-reports/BUG-002.md) | Completed appointment moved backward | Closed after automated retest: HTTP 400 and unchanged persisted state |
| [BUG-003](bug-reports/BUG-003.md) | Repeated completion created duplicate invoices | Closed after sequential/concurrent retest: exactly one invoice |
| [BUG-004](bug-reports/BUG-004.md) | Cash payment UI failed to persist received amount | Closed after retest: amountPaid = finalAmount, debt = 0 |

Follow **New -> Open -> Fixed -> Retest -> Closed**; failed retest leads to Reopened. Preserve Before Fix -> After Fix -> Regression evidence. [Before Fix](../automation-testing/reports/runs/QA-20261113T124125327Z-5e0311/execution.json) and [After Fix / Regression](../automation-testing/reports/runs/QA-20261113T124551346Z-2f0e1e/execution.json) are separate immutable records. Closing a bug requires a fix commit and passing linked retest assertions; it does not mark the pending manual suite Pass.

## 6. Requirements Traceability

- [Historical RTM](rtm/historical-rtm.csv): 337 original cases across 20 use cases, specification pages, implementation references and historical results.
- [Focused RTM](rtm/rtm.tsv): 31 requirements; 30 Current and one Deferred payroll requirement. Coverage means Designed, not executed.
- [Focused-to-source links](rtm/trace-links.json): related case mappings, not proof of complete scenario equivalence.
- [Per-run RTM](../automation-testing/reports/runs/QA-20261113T124551346Z-2f0e1e/traceability.csv): manual status and partial automation status in separate fields.

Run `node .github/qa/scripts/audit-qa.js` from the repository root after changing designs/mappings. Follow [CONTRIBUTING.md](../CONTRIBUTING.md) to preserve source and evidence integrity.
