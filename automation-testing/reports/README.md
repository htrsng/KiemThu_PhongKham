# Automation Reports

See the [latest QA summary](../../manual-testing/test-execution/latest-qa-summary.md) for current results. The [expanded run](runs/QA-20261113T153459634Z-3e9268/summary.md) recorded 54 passed and 11 failed. All 12 UI tests passed, and the new failures were in the HTTP suite. The [unit run](runs/QA-20261113T153426945Z-cb851f/unit-results.json) recorded 19 passed, including 6 controller boundary tests and 13 reporting and lifecycle tests. The CI metadata below describes earlier runs.

The [run index](runs/README.md) preserves evidence from before the fix, after the fix, and regression. The [post-fix CI record](ci-after-fix.json) verifies that 53 business tests and 46 Newman assertions passed. Historical results and failed runs are preserved.

The `runs/` directory contains integrated API and UI reports. The `evidence/` directory holds the original snapshot. The Git-ignored `generated/` directory holds local runtime output and caches. [Newman reports](../../api-testing/reports/README.md) have their own directory under API testing.

Published manifests, logs, CSV files, JSON files, and screenshots were moved byte for byte. Source hashes, commits, statuses, and relative evidence paths within runs were preserved. Manifest paths reflect the original run location. Use [legacy-paths.json](legacy-paths.json) to locate moved files.
