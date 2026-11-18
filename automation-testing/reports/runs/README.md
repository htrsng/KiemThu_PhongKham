# Test Runs

See the [latest QA summary](../../../manual-testing/test-execution/latest-qa-summary.md) for the current build status. The table documents individual historical runs.

| Run | Purpose | Result |
| --- | --- | --- |
| [QA-20261113T072849286Z-115a62](QA-20261113T072849286Z-115a62/summary.md) | Baseline and discovery of BUG-004 | 44 passed, 3 failed |
| [QA-20261113T073749688Z-18594c](QA-20261113T073749688Z-18594c/summary.md) | Retested the BUG-004 fix and added an expired-token test | 46 passed, 2 failed |
| [QA-20261113T075024810Z-b5db79](QA-20261113T075024810Z-b5db79/summary.md) | Verified Cypress timing and error export and same-day fixture data | 46 passed, 2 failed |
| [QA-20261113T124125327Z-5e0311](QA-20261113T124125327Z-5e0311/summary.md) | Reran the two BUG-002/003 tests before the fix | 2 failed. Standard API and UI suites were outside this run. |
| [QA-20261113T124551346Z-2f0e1e](QA-20261113T124551346Z-2f0e1e/summary.md) | Post-fix full regression with five additional defect tests | 34 API, 12 UI, and 7 defect tests passed |
| [QA-20261113T124931337Z-ba424a](../../../api-testing/reports/newman/QA-20261113T124931337Z-ba424a/summary.md) | Ran the Postman collection through Newman with dedicated QA data | 21 requests, 46 of 46 assertions passed |
| [QA-20261113T153459634Z-3e9268](QA-20261113T153459634Z-3e9268/summary.md) | Expanded HTTP ownership and invalid-input coverage and found BUG-005/006 | 54 passed, 11 failed across 65 business tests |
| [QA-20261113T153426945Z-cb851f](QA-20261113T153426945Z-cb851f/unit-results.json) | Unit run using a fixed clock and mocked persistence | 6 controller boundary tests and 13 reporting and lifecycle tests passed |
| [QA-20261113T153601759Z-bf5a0c](../../../api-testing/reports/newman/QA-20261113T153601759Z-bf5a0c/summary.md) | Reran Newman after expanding HTTP coverage | 21 requests, 46 of 46 assertions passed |

Each run has its own build, source fingerprint, executor, and timestamps. Read pass counts per run. In the first two runs, UI `durationMs = 0` represents a missing measurement because the exporter could not read the timing field. The updated exporter reads durations and assertion errors from the original Mochawesome output. Unit tests check status consistency across reporters. Published historical data is preserved.

At the time of these historical runs, the new manual retest was marked Not Run. Earlier manual results remain in `history/`. The 407 RTM rows cover 337 historical cases and 70 overlapping regression designs. CI artifacts have their own run IDs and are stored in GitHub Actions. Newman records its results in `newman-results.json`, with counts tracked separately from Node and Cypress.
