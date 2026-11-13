const { spawnSync } = require('node:child_process');
const { writeFileSync, appendFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { root, createRun } = require('../helpers/run-store');
const { reportRun } = require('./report-run');
const { redact } = require('../helpers/redact');
async function main() {
  const suite = process.argv.find((arg) => arg.startsWith('--suite='))?.slice(8) || 'all';
  if (!['all', 'api', 'ui'].includes(suite)) throw new Error('Supported suites: all, api, ui');
  const run = createRun(suite);
  console.log(`Run ID: ${run.manifest.runId}\nReports: ${run.directory}`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `run_id=${run.manifest.runId}\nrun_dir=${run.directory}\n`);
  const env = { ...process.env, QA_RUN_DIR: run.directory };
  delete env.ELECTRON_RUN_AS_NODE;
  const steps = suite === 'ui' ? [] : [
    ['api', root, ['testing/scripts/run-api.js']],
    ['known-defects', root, ['testing/scripts/run-api.js', '--known-defects']],
  ];
  if (suite !== 'api') steps.push(['ui', resolve(root, 'testing/e2e'), ['node_modules/cypress/bin/cypress', 'run']]);
  const outcomes = [];
  for (const [label, cwd, args] of steps) {
    console.log(`Running ${label}...`);
    const result = spawnSync(process.execPath, args, { cwd, env, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024, timeout: 12 * 60000 });
    const log = redact((result.stdout || '') + '\n' + (result.stderr || '') + (result.error ? '\n' + result.error.message : ''));
    writeFileSync(resolve(run.directory, `${label}.log`), log);
    outcomes.push({ suite: label, exitCode: result.status ?? 1 });
    console.log(`${label}: exit ${result.status ?? 1}`);
  }
  run.manifest.finished = new Date().toISOString();
  run.manifest.outcomes = outcomes;
  writeFileSync(resolve(run.directory, 'run.json'), JSON.stringify(run.manifest, null, 2) + '\n');
  const report = await reportRun(run.directory);
  console.log(`Results: ${JSON.stringify(report.counts)}\n${run.directory}/summary.md`);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY,
    `\n## ${run.manifest.runId}\n\nBuild: ${run.manifest.commit}\n\n${require('../helpers/suite-summary').suiteSummary(report.results)}\n\nAll suites attempted. Any failed business test fails CI. Download clinic-qa-evidence for per-case results and traceability.\n`);
  process.exitCode = outcomes.some((outcome) => outcome.exitCode !== 0) || report.counts.Fail || report.counts['Not Run'] ? 1 : 0;
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
