const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, writeFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { parseCsv, csv } = require('../helpers/tabular');
const { createRun, root } = require('../helpers/run-store');
const { redact } = require('../helpers/redact');
const { transition } = require('../helpers/defect-lifecycle');
const { reportRun } = require('../scripts/report-run');
const reporter = require('../helpers/json-reporter');
const { mergeCypressResults } = require('../helpers/cypress-results');

test('CSV preserves multiline Vietnamese fields, commas and quotes', () => {
  const rows = [{ ID: 'TC-1', Expected: 'Tiền mặt, "đã thu"\nDòng 2' }];
  assert.deepEqual(parseCsv('\uFEFF' + csv(rows)), rows);
});
test('Historical execution is preserved separately from new-build manual retest', () => {
  const rows = parseCsv(readFileSync(resolve(root, 'testing/manual/source-cases.csv'), 'utf8'));
  assert.equal(rows.length, 337);
  assert.equal(rows.filter((row) => /^(Pass|Passed)$/.test(row['Historical status'])).length, 337);
  assert.equal(rows.filter((row) => row['Current status'] === 'Not Run').length, 337);
});
test('Historical report keeps source status and actual, including explicit missing values', () => {
  const source = parseCsv(readFileSync(resolve(root, 'testing/manual/source-cases.csv'), 'utf8'));
  const historical = parseCsv(readFileSync(resolve(root, 'docs/qa/history/manual-execution.csv'), 'utf8'));
  assert.equal(historical.length, 337);
  assert.equal(new Set(historical.map((row) => row['Test Case ID'])).size, 337);
  for (const row of historical) {
    const original = source.find((item) => item.ID === row['Test Case ID']);
    assert.equal(row.Status, 'Pass');
    assert.equal(row['Original status'], original['Historical status']);
    assert.equal(row.Actual, original['Historical actual'] || 'Not recorded in original result');
    assert.equal(row['Last tested (sheet note)'], '14/06/2026');
  }
  assert.equal(historical.filter((row) => row.Actual === 'Not recorded in original result').length, 5);
});
test('Run IDs never reuse or overwrite previous metadata', () => {
  const first = createRun('reporting-unit');
  const before = readFileSync(resolve(first.directory, 'run.json'), 'utf8');
  const second = createRun('reporting-unit');
  assert.notEqual(first.manifest.runId, second.manifest.runId);
  assert.equal(readFileSync(resolve(first.directory, 'run.json'), 'utf8'), before);
});
test('Empty/failed processes become explicit infrastructure Fail, with Excel output', async () => {
  const run = createRun('reporting-unit');
  run.manifest.finished = new Date().toISOString();
  run.manifest.outcomes = [{ suite: 'ui', exitCode: 1 }];
  writeFileSync(resolve(run.directory, 'run.json'), JSON.stringify(run.manifest));
  const result = await reportRun(run.directory);
  assert.equal(result.counts.Fail, 1);
  assert.equal(result.counts.Pass, 0);
  assert.match(result.results[0].name, /process failed outside test assertions/);
  assert.ok(readFileSync(resolve(run.directory, 'execution.xlsx')).length > 0);
});
test('Completed execution results cannot be overwritten by the exporter', async () => {
  const run = createRun('reporting-unit');
  run.manifest.finished = new Date().toISOString();
  writeFileSync(resolve(run.directory, 'run.json'), JSON.stringify(run.manifest));
  await reportRun(run.directory);
  const before = readFileSync(resolve(run.directory, 'execution.json'), 'utf8');
  await assert.rejects(() => reportRun(run.directory), /immutable/);
  assert.equal(readFileSync(resolve(run.directory, 'execution.json'), 'utf8'), before);
});
test('Known credentials and JWTs are removed from artifact text', () => {
  const old = process.env.ADMIN_PASS;
  process.env.ADMIN_PASS = 'Unit-Secret-123';
  try { assert.equal(redact('Unit-Secret-123 eyJhbGci.eyJpZCI.signature'), '[REDACTED] [REDACTED JWT]'); }
  finally { if (old === undefined) delete process.env.ADMIN_PASS; else process.env.ADMIN_PASS = old; }
});
test('Skipped Node tests remain Not Run instead of becoming Pass', async () => {
  const records = [];
  for await (const line of reporter([{ type: 'test:pass', data: { name: 'skip', skip: true, details: {} } }])) records.push(JSON.parse(line));
  assert.equal(records[0].status, 'Not Run');
});
test('Cypress uses native measured duration and assertion error, not guessed zero', () => {
  const rows = mergeCypressResults([{ name: 'cash', status: 'Fail', durationMs: 0 }], [{ results: [{ tests: [
    { title: 'cash', state: 'failed', duration: 1842, err: { message: 'expected 0 to equal 100000' } }
  ] }] }]);
  assert.equal(rows[0].durationMs, 1842);
  assert.match(rows[0].error, /expected 0/);
});
test('Cypress state/report mismatches cannot silently become Pass', () => {
  assert.throws(() => mergeCypressResults([{ name: 'cash', status: 'Pass' }], [{ results: [{ tests: [
    { title: 'cash', state: 'failed', duration: 1842, err: { message: 'failure' } }
  ] }] }]), /state mismatch/);
});
test('Defects cannot jump from New directly to Closed', () => {
  assert.throws(() => transition({ state: 'New' }, { state: 'Closed' }), /Invalid defect transition/);
});
test('A claimed fix without a build commit is rejected', () => {
  assert.throws(() => transition({ state: 'Open' }, { state: 'Fixed', actor: 'unit', note: 'unit', evidence: 'README.md' }), /full fix commit/);
});
test('A failed real retest cannot close a defect', () => {
  const evidence = 'docs/qa/runs/QA-20261113T072849286Z-115a62/execution.json';
  const report = JSON.parse(readFileSync(resolve(root, evidence), 'utf8'));
  const defect = { id: 'BUG-004', state: 'Retest', history: [{ state: 'Fixed', fixCommit: report.commit }, { state: 'Retest', evidence }] };
  assert.throws(() => transition(defect, { state: 'Closed', actor: 'unit', note: 'unit', evidence }), /Cannot close/);
});
