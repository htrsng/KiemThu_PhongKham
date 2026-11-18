# Shared QA Infrastructure

`scripts/` coordinates test suites, imports source documents, audits reports, and updates defect lifecycles. `helpers/` manages run IDs, CSV/Excel files, HTTP observations, and redaction. `unit/` verifies reporting and lifecycle behavior. Business tests live in `api-testing/automated-tests/` and `automation-testing/cypress/`.

Run the following from the repository root after completing the setup in the [main README](../../README.md).

```sh
node .github/qa/scripts/audit-qa.js
node .github/qa/scripts/run-unit.js
node --env-file=.env.test .github/qa/scripts/run-qa.js
node --env-file=.env.test .github/qa/scripts/run-postman.js
```

To audit a run, use `node .github/qa/scripts/audit-run.js <run-directory>`. To publish a run, use `node --env-file=.env.test .github/qa/scripts/publish-run.js <Run-ID>`. Published runs are immutable. Keep the Git-ignored `.env.test` file in the repository root and out of commits.
