# Defect Register

The [defect-to-test mapping and interview guide](bug-testcase-map.md) covers all six defects, pre-fix and post-fix evidence, severity and priority rationale, and the counting method for the 46 API tests and 12 Cypress tests.

| ID | Summary | Severity | Priority | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| [BUG-001](BUG-001.md) | An incorrect password caused the login form to lose its error message | Medium | P1 | Closed based on historical CI | [Details](BUG-001.md) |
| [BUG-002](BUG-002.md) | PATCH allowed a completed appointment to move to an earlier state | High | P1 | Closed after retest | [Before](../../automation-testing/reports/runs/QA-20261113T124125327Z-5e0311/execution.json) · [After](../../automation-testing/reports/runs/QA-20261113T124551346Z-2f0e1e/execution.json) |
| [BUG-003](BUG-003.md) | Repeated completion created duplicate invoices | High | P0 | Closed after retest | [Before](../../automation-testing/reports/runs/QA-20261113T124125327Z-5e0311/execution.json) · [After](../../automation-testing/reports/runs/QA-20261113T124551346Z-2f0e1e/execution.json) |
| [BUG-004](BUG-004.md) | The payment UI failed to save the amount collected | High | P1 | Closed after fix and retest | [Before](../../automation-testing/reports/runs/QA-20261113T072849286Z-115a62/execution.json) · [After](../../automation-testing/reports/runs/QA-20261113T073749688Z-18594c/execution.json) |
| [BUG-005](BUG-005.md) | A doctor could read or update another doctor's appointment | High | P0 | Closed after retest | [Before](../../automation-testing/reports/runs/QA-20261113T153459634Z-3e9268/execution.json) · [After](../../automation-testing/reports/runs/QA-20261114T164815189Z-178426/execution.json) |
| [BUG-006](BUG-006.md) | Missing inputs or malformed IDs returned HTTP 500 | Medium | P2 | Closed after retest | [Before](../../automation-testing/reports/runs/QA-20261113T153459634Z-3e9268/execution.json) · [After](../../automation-testing/reports/runs/QA-20261114T164815189Z-178426/execution.json) |

The registry contains **6 defects, with 6 Closed and 0 Open**. BUG-005 and BUG-006 were fixed in commit `1bb247a`. All 65 business tests passed on retest. The pre-fix report preserves its 54 passed and 11 failed results. The [40-case priority workbook](../test-execution/manual-runs/MAN-20261114-01/manual-regression.xlsx) records 38 passed, 1 failed, and 1 blocked. Manual screenshots were still being added at the time of that record. The separate negative-surcharge finding TC-PAY-016 remains outside those fixes. See the [registry](registry.json), [latest QA summary](../test-execution/latest-qa-summary.md), and [historical report](../test-execution/test-report.md).

The defect lifecycle is New → Open → Fixed → Retest → Closed. A failed retest moves the defect to Reopened, then Open or Fixed. The `.github/qa/scripts/defect.js` script requires an actor, a note, and evidence. Fixed requires an existing commit. Retest requires a build that includes the fix. Closed requires a retest run in which all linked assertions pass. Imported statuses for BUG-001/002/003 are labeled as historical, with unrecorded transition times left blank.
