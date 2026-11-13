const { spawnSync } = require('node:child_process');
const { mkdirSync, writeFileSync, readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { root, activeRun } = require('../helpers/run-store');
const { directory: runDirectory, manifest } = activeRun('api');
const suite = process.argv.includes('--known-defects') ? 'known-defects' : 'api';
const directory = resolve(runDirectory, suite);
mkdirSync(directory); // Refuse to overwrite this suite inside the same run.
const files = suite === 'known-defects' ? ['api-testing/automated-tests/known-defects.test.js']
  : ['api-testing/automated-tests/auth.test.js', 'api-testing/automated-tests/authorization-invoice.test.js',
    'api-testing/automated-tests/coverage-gaps.test.js'];
const result = spawnSync(process.execPath, ['--test', '--test-concurrency=1',
  '--test-reporter=tap', `--test-reporter-destination=${directory}/results.tap`,
  '--test-reporter=junit', `--test-reporter-destination=${directory}/junit.xml`,
  '--test-reporter=./.github/qa/helpers/json-reporter.js', `--test-reporter-destination=${directory}/results.jsonl`, ...files],
{ cwd: root, env: { ...process.env, QA_RUN_DIR: runDirectory, QA_SUITE: suite }, stdio: 'inherit' });
const tap = readFileSync(resolve(directory, 'results.tap'), 'utf8');
const counts = Object.fromEntries(['tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo'].map((key) => {
  const match = tap.match(new RegExp(`^# ${key} (\\d+)$`, 'm'));
  return [key, match ? Number(match[1]) : null];
}));
writeFileSync(resolve(directory, 'suite.json'), JSON.stringify({ runId: manifest.runId, suite, counts,
  exitCode: result.status ?? 1, infrastructureError: result.error?.message || null, finished: new Date().toISOString() }, null, 2) + '\n');
console.log(`${manifest.runId} ${suite}: ${JSON.stringify(counts)}; evidence ${directory}`);
if (!process.env.QA_RUN_DIR) {
  manifest.finished = new Date().toISOString();
  manifest.outcomes = [{ suite, exitCode: result.status ?? 1 }];
  writeFileSync(resolve(runDirectory, 'run.json'), JSON.stringify(manifest, null, 2) + '\n');
  require('./report-run').reportRun(runDirectory).catch((error) => { console.error(error); process.exitCode = 1; });
}
process.exitCode = result.status ?? 1;
