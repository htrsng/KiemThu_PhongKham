# Contributing

Use the same entry points and paths as the [project overview](README.md): [Manual Testing](manual-testing/README.md), [API Testing](api-testing/README.md) and [Automation Testing](automation-testing/README.md).

## Repository responsibilities

| Location | Content |
| --- | --- |
| `manual-testing/` | Test plan, scenarios, cases, execution, bug reports and RTM |
| `api-testing/` | Node API tests, Postman/Newman and API report index |
| `automation-testing/` | Cypress specs/support, shared data fixtures and reports |
| `docs/requirements/`, `docs/academic/` | Specification, source reconciliation and original academic records |
| `.github/qa/`, `.github/workflows/` | Shared runners/reporting helpers and CI |
| `client/`, `server/` | Application under test |

## Test and evidence rules

- Use synthetic data, loopback services and a QA database ending in `_test`. Never commit `.env.test`, passwords, tokens, real patient data or installed dependencies.
- Every automated test needs observable assertions, isolated data and cleanup by owned IDs. Check stored state after business mutations when relevant.
- `manual-testing/test-cases/source-cases.csv` preserves 337 historical cases; historical results live in `manual-testing/test-execution/history/`. The 70 focused cases overlap that inventory, and the 40-case suite is a priority subset. Do not add those counts together or inherit historical Pass into new-build retest.
- Record actual manual execution with build, date/time, executor, Expected, Actual, status, Bug ID and evidence. Automation Partial is not a complete manual Pass.
- Give every automated run a unique Run ID/build/executor and directory. Do not edit published results. Retain Before Fix, After Fix and Regression evidence; use `automation-testing/reports/legacy-paths.json` to resolve paths from older records.
- Use `BUG-xxx`, `TC-AREA-xxx` and `REQ-AREA-xxx` identifiers. Defects need reproducible steps, expected/actual, environment and evidence. Preserve original academic identifiers when importing sources.
- Severity: Critical (data loss/system blocker), High (major business impact), Medium (impact with a workaround), Low (minor impact). Priority: P0 release blocker, P1 current cycle, P2 next cycle, P3 backlog.
- Follow New -> Open -> Fixed -> Retest -> Closed; failed retest leads to Reopened. Never remove assertions to turn Fail into Pass. The lifecycle tool requires fix/evidence verification before closing a defect.

## Validation

Run from the repository root after following [project setup](README.md#6-how-to-run-tests):

```sh
node .github/qa/scripts/audit-qa.js
node --test .github/qa/unit/qa-reporting.test.js
```

For changes affecting application behavior, tests or runner configuration, also run the relevant API/Cypress/Newman suites and frontend build as applicable. Documentation-only edits require link, path and factual consistency checks; no new business-test execution is implied by editing a README.

Audit a completed run with `node .github/qa/scripts/audit-run.js <run-directory>`. Runtime output is ignored under `automation-testing/reports/generated/`; publish selected evidence using the [shared QA scripts](.github/qa/README.md), never overwrite an existing published Run ID. Preserve any in-progress manual workbook edits.
