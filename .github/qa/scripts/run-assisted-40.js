// Run only the assisted inventory; it does not change the normal CI/E2E suite.
const { spawnSync } = require('node:child_process');
const { writeFileSync, existsSync } = require('node:fs');
const { resolve } = require('node:path');
const { root, createRun } = require('../helpers/run-store');
const { redact } = require('../helpers/redact');
const { reportRun } = require('./report-run');
const { assertLocalQa } = require('../../../automation-testing/fixtures/qa-data');
async function main() {
  assertLocalQa();
  const source = process.argv.find((value) => value.startsWith('--source='))?.slice(9)
    || 'manual-testing/test-execution/manual-runs/MAN-20261114-01/manual-regression.xlsx';
  if (!existsSync(resolve(root, source))) throw new Error('Source workbook does not exist');
  const probe = await fetch((process.env.API_URL || 'http://localhost:5000/api') + '/auth/me');
  if (probe.status !== 401) throw new Error('Expected running QA API to reject an unauthenticated request');
  const run = createRun('assisted-40');
  const env = { ...process.env, QA_RUN_DIR: run.directory };
  delete env.ELECTRON_RUN_AS_NODE;
  console.log(`Assisted run: ${run.manifest.runId}`);
  const result = spawnSync(process.execPath, ['node_modules/cypress/bin/cypress', 'run',
    '--config', 'specPattern=cypress/assisted/**/*.cy.js,responseTimeout=60000',
    '--env', `ASSISTED_SCREENSHOTS=${process.argv.includes('--screenshots')}`,
    '--spec', 'cypress/assisted/priority-40.cy.js'],
  { cwd: resolve(root, 'automation-testing'), env, encoding: 'utf8', timeout: 15 * 60000, maxBuffer: 30 * 1024 * 1024 });
  writeFileSync(resolve(run.directory, 'ui.log'), redact((result.stdout || '') + '\n' + (result.stderr || '') + (result.error?.message || '')));
  run.manifest.finished = new Date().toISOString();
  run.manifest.outcomes = [{ suite: 'ui', exitCode: result.status ?? 1 }];
  writeFileSync(resolve(run.directory, 'run.json'), JSON.stringify(run.manifest, null, 2) + '\n');
  const report = await reportRun(run.directory);
  const output = `manual-testing/test-execution/assisted-runs/${run.manifest.runId}/manual-regression-results.xlsx`;
  const exported = spawnSync('python', ['.github/qa/scripts/export-assisted-40.py', '--run', run.directory,
    '--source', source, '--output', output], { cwd: root, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  console.log(redact(exported.stdout || ''));
  if (exported.status !== 0) throw new Error(redact(exported.stderr || 'Workbook export failed'));
  console.log(`Native results: ${JSON.stringify(report.counts)}\nWorkbook: ${output}`);
  process.exitCode = result.status !== 0 || report.counts.Fail ? 1 : 0;
}
main().catch((error) => { console.error(redact(error.message)); process.exitCode = 1; });
