# Execution Evidence — 13 November 2026

This local run used Windows, Node.js 22.15.0, a dedicated local MongoDB 8.2.3 database ending in `_test`, Cypress 15.17.0 with headless Electron 138, and the Asia/Saigon time zone. Manifest timestamps use UTC. Add seven hours for Vietnam local time. CI uses MongoDB 7 and Node.js 24. At the time of this snapshot, a newer run comparing the two environments was unavailable.

The run used a working tree based on commit `68a2e6ae63961e04aedc995a30319fa4912231fb` with local changes. SHA-256 hashes in the manifests and `source-hashes.json` identify the files used. Documentation was updated after execution. The hashes cover the listed source files.

| File | Source and meaning |
| --- | --- |
| [api-results.tap](api-results.tap), [api-junit.xml](api-junit.xml) | Node test runner output with 26 passed and 0 failed |
| [api-manifest.json](api-manifest.json) | Timestamp, Node version, base commit, test and helper hashes, and counts parsed from TAP |
| [known-defects-results.tap](known-defects-results.tap), [JUnit](known-defects-junit.xml) | Two failed requirement assertions with actual and expected results for BUG-002 and BUG-003 |
| [known-defects-manifest.json](known-defects-manifest.json) | Separate manifest with exit code 1. Its results are outside the regression pass count. |
| [cypress-results.json](cypress-results.json) | Names, statuses, durations, and statistics extracted from Mochawesome JSON. All 10 tests passed. |
| [source-hashes.json](source-hashes.json) | Hashes for specs, configuration, helpers, and related application code |
| [Check-in](reception-checkin-persisted.png), [Invoice](invoice-detail.png) | Cypress screenshots taken after successful assertions using synthetic QA data |

## Commands Executed

```sh
npm run build --prefix client
node --env-file=testing/.env.test testing/scripts/seed-test-accounts.js
node --env-file=testing/.env.test testing/scripts/run-api.js
node --env-file=testing/.env.test testing/scripts/run-api.js --known-defects
```

The following command ran from `testing/e2e`.

```sh
node --env-file=../.env.test node_modules/cypress/bin/cypress run
```

The frontend build passed and transformed 2,942 modules. It reported warnings about large bundles and stale Browserslist data. The evidence bundle omits the raw build output. Cypress recorded zero retries, pending tests, or skipped tests. The HTML report and video were kept in a Git-ignored local artifact directory. The JSON here contains extracted results.

Files were selected using `testing/scripts/snapshot-evidence.js 2026-11-13`. Text files were checked for passwords and JWTs, and both screenshots were reviewed. This snapshot covers one local run. Manual execution, Postman, newer CI runs, and cross-browser compatibility are outside its scope.
