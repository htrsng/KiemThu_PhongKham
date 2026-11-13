const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { resolve, relative } = require('node:path');
const { root } = require('../helpers/run-store');
const { parseCsv } = require('../helpers/tabular');
function auditRun(directory) {
  const report = JSON.parse(readFileSync(resolve(directory, 'execution.json'), 'utf8'));
  assert.ok(report.runId && report.finished && report.executor && report.commit && report.workingTreeHash, 'Missing run/build metadata');
  const cases = [...parseCsv(readFileSync(resolve(root, 'manual-testing/test-cases/source-cases.csv'), 'utf8')),
    ...parseCsv(readFileSync(resolve(root, 'manual-testing/test-cases/test-cases.csv'), 'utf8'))];
  const ids = new Set(cases.map((row) => row.ID));
  const automatedIds = new Set();
  for (const result of report.results) {
    for (const field of ['runId', 'executedAt', 'build', 'executor', 'automationId', 'expected', 'actual', 'status']) assert.ok(result[field], `Missing result field ${field}`);
    assert.equal(result.runId, report.runId);
    assert.ok(['Pass', 'Fail', 'Blocked', 'Not Run'].includes(result.status));
    assert.ok(!automatedIds.has(result.automationId), 'Duplicate automation result'); automatedIds.add(result.automationId);
    for (const id of [...result.testCaseIds, ...result.sourceCaseIds]) assert.ok(ids.has(id), `Unknown result case ${id}`);
    assert.ok(result.evidence.length, 'Missing evidence link');
    for (const file of result.evidence) {
      const target = resolve(directory, file);
      assert.ok(!relative(directory, target).startsWith('..'), 'Evidence escapes run');
      assert.ok(existsSync(target), `Missing evidence ${file}`);
    }
  }
  for (const status of ['Pass', 'Fail', 'Blocked', 'Not Run']) assert.equal(report.counts[status], report.results.filter((row) => row.status === status).length);
  const trace = parseCsv(readFileSync(resolve(directory, 'traceability.csv'), 'utf8'));
  assert.equal(trace.length, cases.length);
  assert.equal(new Set(trace.map((row) => row['Test Case ID'])).size, cases.length);
  for (const row of trace) {
    assert.ok(ids.has(row['Test Case ID']));
    assert.equal(row['Manual status'], 'Not Run', 'Automation must not overwrite manual execution');
    if (row['Automation status'] !== 'Not Run') assert.ok(row.Evidence && row['Automation coverage'].startsWith('Partial'));
  }
  for (const suite of ['api', 'known-defects', 'ui']) {
    const path = resolve(directory, suite, 'suite.json');
    if (!existsSync(path)) continue;
    const data = JSON.parse(readFileSync(path, 'utf8'));
    if (data.counts.tests != null) assert.equal(report.results.filter((row) => row.suite === suite).length, data.counts.tests, `Lost results for ${suite}`);
  }
  console.log(`Run audit passed: ${report.runId}; ${report.results.length} results, ${trace.length} trace rows, all evidence links valid.`);
  return report;
}
if (require.main === module) {
  try { auditRun(resolve(process.argv[2])); } catch (error) { console.error(error); process.exitCode = 1; }
}
module.exports = { auditRun };
