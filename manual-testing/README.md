# Manual Testing

[Project overview](../README.md) | [API testing](../api-testing/README.md) | [Test automation](../automation-testing/README.md)

## 1. Overview

Manual testing turns SmileCare business requirements into scenarios, test cases, execution records, and reproducible defect reports. Earlier functional testing covered 20 use cases, including master data, appointments, reception and treatment, payments, revenue, and payroll. Current regression design prioritizes authentication, authorization, appointments and check-in, and invoices and payments.

Start with the [test plan](test-plan/test-plan.md) and [scenario catalog](test-scenarios/scenarios.md). Each record identifies its scope, including historical execution and retesting on newer builds.

## 2. Test Design Techniques

| Technique | Application | Design examples |
| --- | --- | --- |
| Equivalence Partitioning (EP) | Valid and invalid email, insufficient payment with debt allowed or disallowed | TC-AUTH-003, TC-PAY-007/008 |
| Boundary Value Analysis (BVA) | Check-in timing limits, minimum password length, 100% discounts, and negative surcharges | TC-AUTH-006, TC-APPT-011 through 014, TC-PAY-012/016 |
| Decision Table | Fixed or percentage discounts combined with surcharges | TC-PAY-013/014 |
| State Transition | Valid appointment transitions and invalid reversals or cancellation | TC-APPT-016 through 021 |
| Error Guessing | Repeated appointment completion and duplicate invoice creation | TC-APPT-022 / BUG-003 |

These are **design examples** with execution recorded separately. Six controller unit tests use a fixed clock and mocked persistence to check exactly ±30 minutes and offsets of 1 ms. HTTP tests cover check-in 29 minutes early, 31 minutes late, and near the scheduled time. HTTP, UI, and manual evidence at the exact boundary is still pending.

## 3. Test Case Inventories

| Inventory | Purpose | How to read the results |
| --- | --- | --- |
| [337 original cases](test-cases/source-cases.csv) across 20 use cases | Normalizes the original workbook while preserving source sheets, row numbers, and results | Excel records 337 historical passes |
| [70 focused cases](test-cases/test-cases.csv) | Regression designs with steps, test data, expectations, priorities, and techniques | Some assertions are automated. A full manual retest of this set is still pending. |
| [40-case priority subset](test-cases/regression-suite.csv) | Authentication, authorization, appointments, check-in, payment, and BUG-002/003/004 | **38 passed, 1 failed, 1 blocked**. Assisted API/UI results have separate evidence. |

The 70 focused cases overlap with the 337 historical cases, and the 40 priority cases are a subset of the focused cases. Count each inventory within its scope. Partial automation coverage leaves manual execution status to the workbook.

On a CV, describe the 70 cases as a **70-case regression design** and report the 40-case execution separately. The 337 historical passes predate the current retest evidence. See the [registry](bug-reports/registry.json) and linked reports for the discovery, fix, and retest evidence for each defect.

The [source corrections](test-cases/source-corrections.json) fill four missing design fields while preserving the original file, historical statuses, and missing actual results. **Excel is the source of record for the earlier functional catalog and its 337 historical passes across 20 use cases.** The PDF is kept as a reference. See the [source reconciliation](../docs/requirements/source-reconciliation.md) for the provenance check.

## 4. Test Execution

The [MAN-20261114-01 workbook](test-execution/manual-runs/MAN-20261114-01/manual-regression.xlsx) records the build, time, actual result, and status in the **Execution** sheet. Use the [blank 40-case workbook](test-execution/manual-regression.xlsx) for a new run. The [master workbook](test-execution/test-execution.xlsx) is kept separately.

The recorded results are **38 passed, 1 failed, and 1 blocked**. TC-PAY-016 failed because the app accepted a surcharge of `-1` and saved both the total due and the amount collected as `99999`. TC-APPT-014 was blocked because exact timing equality was unverified. See the [assisted API/UI evidence](test-execution/assisted-runs/README.md) and [execution and retest guide](test-execution/manual-regression.md).

1. Save a fresh copy for each run ID. Record the build commit, environment and browser, tester, and actual execution time.
2. Prepare synthetic data and record the patient, appointment, or invoice IDs used. Execute on the recorded build.
3. Compare observations with **Expected**. Record messages, HTTP status, persisted state, invoice count, or the actual balance under **Actual**, with a screenshot or redacted response.
4. Use **Pass** when all expectations are observed, **Fail** for a discrepancy, **Blocked** when a prerequisite or feature is missing, and **Not Run** for untouched cases. Add the Bug ID for defects.

Earlier results are available in [Excel](test-execution/history/manual-execution.xlsx) and [CSV](test-execution/history/manual-execution.csv). Source metadata gaps are recorded explicitly. Keep automated results in their own fields, and leave missing historical actuals marked as unavailable.

The [latest QA summary](test-execution/latest-qa-summary.md) gives the current status. The [historical report](test-execution/test-report.md) preserves runs from before coverage expanded. The 40-case workbook records the two follow-up items above, and the 337-case record documents earlier execution.

## 5. Defect Management

The [defect register](bug-reports/README.md) links prerequisites, reproduction steps, expected and actual results, severity, priority, and evidence. The [JSON registry](bug-reports/registry.json) records lifecycle events.

| Defect | Symptom | Verification result |
| --- | --- | --- |
| [BUG-002](bug-reports/BUG-002.md) | A completed appointment could move to an earlier state | Closed after automated retest. HTTP 400 and persisted state unchanged. |
| [BUG-003](bug-reports/BUG-003.md) | Repeated completion created duplicate invoices | Closed after sequential and concurrent retesting. Exactly one invoice. |
| [BUG-004](bug-reports/BUG-004.md) | Cash payment in the UI failed to save the amount collected | Closed after retest. `amountPaid = finalAmount` and `debt = 0`. |
| [BUG-005](bug-reports/BUG-005.md) | A doctor could read or update another doctor's appointment | Closed, High/P0. Three HTTP tests passed after the fix. |
| [BUG-006](bug-reports/BUG-006.md) | Missing data or malformed IDs returned HTTP 500 | Closed, Medium/P2. Nine HTTP tests passed after the fix. |

The lifecycle is **New → Open → Fixed → Retest → Closed**. A failed retest moves the defect to Reopened. Keep independent [pre-fix](../automation-testing/reports/runs/QA-20261113T124125327Z-5e0311/execution.json) and [post-fix and regression](../automation-testing/reports/runs/QA-20261113T124551346Z-2f0e1e/execution.json) records. Closing a defect requires a fix commit and a retest with all linked assertions passing. Record workbook and automated outcomes in their respective scopes.

## 6. Requirements Traceability

- The [historical RTM](rtm/historical-rtm.csv) maps 337 original cases across 20 use cases to specification pages, relevant code, and historical results.
- The [focused RTM](rtm/rtm.tsv) tracks 31 requirements, with 30 Current and one payroll requirement Deferred. The coverage label Designed records test design status.
- The [focused-to-source case links](rtm/trace-links.json) connect related behaviors. The degree of equivalence depends on each case's steps and expectations.
- The [run-level RTM](../automation-testing/reports/runs/QA-20261113T124551346Z-2f0e1e/traceability.csv) records manual status and partial automation status in separate fields.

Run `node .github/qa/scripts/audit-qa.js` from the repository root after editing designs or mappings. Follow [CONTRIBUTING.md](../CONTRIBUTING.md) to preserve sources and evidence.
