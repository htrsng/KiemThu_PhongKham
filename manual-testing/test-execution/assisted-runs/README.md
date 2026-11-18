# Assisted Execution Results for 40 Test Cases

Open the [completed workbook](QA-20261114T151532131Z-c5d60f/manual-regression-results.xlsx) and select the **Ket qua ho tro 40 case** sheet.

| Record | Result | Interpretation |
| --- | --- | --- |
| 40 rows assessed in Excel | 38 passed, 1 failed, 1 blocked | Observed API/UI assertion outcomes with verification limits recorded |
| Cypress native results for the same run | 39 passed, 1 failed | TC-APPT-014 passed the HTTP check near the appointment time. Excel records Blocked because exact timing was unverified. |
| Execution sheet in the original assisted snapshot | 2 passed, 38 not run | Preserves the manual data available when the snapshot was created. |

This record contains **automated API/UI assistance**. API checks sent real HTTP requests, and UI checks ran in Cypress. Actual results and pass decisions are based on observations. Independent confirmation of manual execution for all 40 cases is unavailable.

The [current workbook](../manual-runs/MAN-20261114-01/manual-regression.xlsx) records 38 passed, 1 failed, and 1 blocked. Manual screenshots were still being added. The assisted snapshot is preserved for traceability.

## Reading the Workbook

- **Ket qua ho tro 40 case** lists the run ID, build, time, actual result, status, verification method, scope, and evidence link for each row.
- **Tong hop ho tro** contains the summary, environment, fingerprint, source file, and notes on interpreting the results.
- **Execution / Run setup** copy the manual data available at the time. The workbook source was preserved. Older screenshot paths in these sheets are relative to the original manual directory.
- The adjacent `evidence/` directory contains 40 JSON observations and a screenshot of the negative surcharge issue. Copy the workbook and directory together. Link any additional manual screenshots or Postman evidence from the relevant row.

## Cases That Need Follow-up

- **TC-PAY-016 — Failed.** With a surcharge of `-1`, the UI still sent a payment update. A GET confirmed the invoice was paid (`Đã thanh toán`) with `finalAmount = amountPaid = 99999`. The Bug ID column records that the finding still needs classification.
- **TC-APPT-014 — Blocked.** Check-in near the appointment time returned HTTP 200 and saved `checkInTime`. The evidence records the actual difference. Verifying exact `now == startTime` still requires a controlled clock.

The [JSON summary](QA-20261114T151532131Z-c5d60f/assisted-results.json) and [native run](../../../automation-testing/reports/runs/QA-20261114T151532131Z-c5d60f/execution.json) preserve the source results. Track this run separately from the 65-test business run and the manual pass count in the current QA summary.

## Rerunning the Suite

Set up the backend, frontend, and QA environment as described in the main README. Run the following from the repository root.

```sh
node --env-file=.env.test .github/qa/scripts/run-assisted-40.js --source=manual-testing/test-execution/manual-runs/MAN-20261114-01/manual-regression.xlsx
```

Exporting the workbook requires Python with `openpyxl`. Use `--screenshots` to capture additional UI evidence. JSON observations are recorded by default. Each execution creates a new run ID and output file and preserves the source workbook. The assisted spec lives in `automation-testing/cypress/assisted/`, outside the standard E2E glob.
