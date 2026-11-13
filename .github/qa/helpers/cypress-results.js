const assert = require('node:assert/strict');
function collect(suite) {
  return [...(suite.tests || []), ...(suite.suites || []).flatMap(collect)];
}
function mergeCypressResults(rows, reports) {
  const tests = reports.flatMap((report) => report.results.flatMap(collect));
  const byTitle = new Map(tests.map((test) => [test.title, test]));
  assert.equal(byTitle.size, tests.length, 'Ambiguous duplicate Cypress titles');
  return rows.map((row) => {
    const test = byTitle.get(row.name);
    assert.ok(test, `Missing native Mochawesome result: ${row.name}`);
    assert.equal(typeof test.duration, 'number', `Missing measured duration: ${row.name}`);
    assert.equal(row.status, ({ passed: 'Pass', failed: 'Fail', pending: 'Not Run', skipped: 'Not Run' })[test.state], 'Cypress result state mismatch');
    return { ...row, durationMs: test.duration, error: test.err?.message || row.error || null };
  });
}
module.exports = { mergeCypressResults };
