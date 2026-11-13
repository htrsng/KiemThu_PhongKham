const { spawnSync } = require('node:child_process');
const { mkdirSync, writeFileSync, readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { createRun, root } = require('../helpers/run-store');
const { redact } = require('../helpers/redact');
const run = createRun('unit');
const directory = resolve(run.directory, 'unit');
mkdirSync(directory);
const result = spawnSync(process.execPath, ['--test', '--test-concurrency=1',
  '--test-reporter=tap', `--test-reporter-destination=${directory}/results.tap`,
  '--test-reporter=junit', `--test-reporter-destination=${directory}/junit.xml`,
  '.github/qa/unit/qa-reporting.test.js', '.github/qa/unit/check-in-boundary.test.js'],
{ cwd: root, env: process.env, encoding: 'utf8', timeout: 120000 });
writeFileSync(resolve(directory, 'process.log'), redact((result.stdout || '') + (result.stderr || '') + (result.error?.message || '')));
const tap = readFileSync(resolve(directory, 'results.tap'), 'utf8');
const counts = Object.fromEntries(['tests', 'pass', 'fail', 'skipped', 'cancelled'].map((key) => [key,
  Number(tap.match(new RegExp(`^# ${key} (\\d+)$`, 'm'))?.[1] ?? -1)]));
run.manifest.finished = new Date().toISOString();
const report = { ...run.manifest, counts, exitCode: result.status ?? 1,
  scope: '13 reporting/lifecycle tests + 6 fixed-clock controller tests with mocked persistence; not HTTP or manual execution' };
writeFileSync(resolve(run.directory, 'run.json'), JSON.stringify(run.manifest, null, 2) + '\n');
writeFileSync(resolve(run.directory, 'unit-results.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`${run.manifest.runId}: ${JSON.stringify(counts)}; evidence ${directory}`);
process.exitCode = result.status || counts.fail || counts.skipped || counts.cancelled || counts.tests !== 19 ? 1 : 0;
