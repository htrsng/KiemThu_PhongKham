// Validate traceability and required fields without counting designs as execution.
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { parseCsv } = require('../helpers/tabular');
const root = resolve(__dirname, '../../..');
function rows(file) {
  const lines = readFileSync(resolve(root, file), 'utf8').replace(/^\uFEFF/, '').trimEnd().split(/\r?\n/);
  const headers = lines.shift().split('\t');
  return lines.map((line) => {
    const fields = line.split('\t');
    assert.equal(fields.length, headers.length, `Invalid columns in ${file}`);
    return Object.fromEntries(headers.map((key, index) => [key, fields[index]]));
  });
}
const rtm = rows('manual-testing/rtm/rtm.tsv');
// CSV may contain quoted commas/newlines. Parse records rather than splitting lines.
function csvRecords(text) {
  const records = [];
  let row = [], field = '', quoted = false;
  text = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  for (let index = 0; index < text.length; index++) {
    const ch = text[index];
    if (ch === '"') {
      if (quoted && text[index + 1] === '"') { field += '"'; index++; }
      else quoted = !quoted;
    } else if (!quoted && (ch === ',' || ch === '\n')) {
      row.push(field); field = '';
      if (ch === '\n') { records.push(row); row = []; }
    } else field += ch;
  }
  assert.equal(quoted, false, 'Unclosed CSV quote');
  if (field || row.length) { row.push(field); records.push(row); }
  return records;
}
const csv = csvRecords(readFileSync(resolve(root, 'manual-testing/test-cases/test-cases.csv'), 'utf8'));
const headers = csv.shift();
assert.ok(headers?.includes('ID'), 'Missing CSV header');
const cases = csv.map((fields) => {
  assert.equal(fields.length, headers.length, 'Invalid test case CSV columns');
  return Object.fromEntries(headers.map((key, index) => [key, fields[index]]));
});
assert.ok(cases.length > 0, 'Empty test case inventory');
const ids = new Set(cases.map((row) => row.ID));
assert.equal(ids.size, cases.length, 'Duplicate test case IDs');
assert.equal(new Set(rtm.map((row) => row['Requirement ID'])).size, rtm.length, 'Duplicate requirement IDs');
for (const row of cases) {
  for (const field of ['ID', 'Precondition', 'Test data', 'Steps', 'Expected', 'Priority', 'Technique']) {
    assert.ok(row[field]?.trim(), `${row.ID}: missing ${field}`);
  }
}
const mapped = new Set();
for (const row of rtm) {
  assert.ok(['Current', 'Deferred'].includes(row.Scope), 'Missing requirement scope');
  assert.equal(row.Coverage, 'Designed', 'Do not imply execution from a design mapping');
  for (const id of row['Test case IDs'].split(',').map((value) => value.trim())) {
    assert.ok(ids.has(id), `${row['Requirement ID']}: unknown ${id}`);
    mapped.add(id);
  }
}
assert.deepEqual([...ids].filter((id) => !mapped.has(id)), [], 'Unmapped test cases');
const source = parseCsv(readFileSync(resolve(root, 'manual-testing/test-cases/source-cases.csv'), 'utf8'));
const reconciliation = JSON.parse(readFileSync(resolve(root, 'docs/requirements/source-reconciliation.json'), 'utf8'));
assert.equal(source.length, reconciliation.excel.total, 'Source baseline count mismatch');
assert.equal(new Set(source.map((row) => row.ID)).size, source.length, 'Duplicate source IDs');
assert.equal(new Set(source.map((row) => row['Use case'])).size, 20, 'Missing original use cases');
for (const file of reconciliation.sources) {
  assert.equal(createHash('sha256').update(readFileSync(resolve(root, file.file))).digest('hex'), file.sha256, `Source document changed: ${file.file}`);
}
for (const row of source) {
  assert.match(row.Priority, /^P[0-3]$/, `${row.ID}: invalid priority`);
  assert.equal(row['Current status'], 'Not Run', 'A new manual retest must not inherit historical Pass');
  assert.ok(row.Description && row['Source row'] && row['Source sheet'], `${row.ID}: missing provenance`);
  if (!row.Steps || !row.Expected || !row['Test data']) assert.match(row['Design review'], /Needs review/, 'Incomplete design must be flagged');
}
const links = JSON.parse(readFileSync(resolve(root, 'manual-testing/rtm/trace-links.json'), 'utf8'));
const sourceIds = new Set(source.map((row) => row.ID));
const corrections = JSON.parse(readFileSync(resolve(root, 'manual-testing/test-cases/source-corrections.json'), 'utf8'));
assert.equal(Object.keys(corrections).length, 4);
assert.equal(reconciliation.unresolvedDesignIssues, 0, 'Unresolved original design fields');
for (const [id, correction] of Object.entries(corrections)) {
  const item = source.find((row) => row.ID === id);
  assert.ok(item && item['Design correction'] === correction.reference, `Missing correction provenance: ${id}`);
  for (const [field, value] of Object.entries(correction.fields)) assert.equal(item[field], value);
  assert.ok(item.Steps && item.Expected && item['Step expected'] && item['Test data'], `Incomplete revised design: ${id}`);
}
const manual = parseCsv(readFileSync(resolve(root, 'manual-testing/test-cases/regression-suite.csv'), 'utf8'));
assert.equal(manual.length, 40);
assert.equal(new Set(manual.map((item) => item['Test Case ID'])).size, 40);
manual.forEach((item) => {
  assert.ok(ids.has(item['Test Case ID']) && item.Steps && item.Expected);
  assert.equal(item.Status, 'Not Run', 'The committed template must not imply a manual execution');
  assert.equal(item.Actual, '');
});
const historical = parseCsv(readFileSync(resolve(root, 'manual-testing/test-execution/history/manual-execution.csv'), 'utf8'));
const historicalTrace = parseCsv(readFileSync(resolve(root, 'manual-testing/rtm/historical-rtm.csv'), 'utf8'));
assert.equal(historical.length, source.length, 'Historical results missing');
assert.equal(historicalTrace.length, source.length, 'Historical traceability incomplete');
assert.equal(new Set(historical.map((row) => row['Test Case ID'])).size, source.length, 'Duplicate historical results');
assert.equal(new Set(historicalTrace.map((row) => row['Use case'])).size, 20, 'Missing historical use case');
for (const row of historical) {
  const original = source.find((item) => item.ID === row['Test Case ID']);
  assert.ok(original, 'Unknown imported historical case');
  const status = /^(Pass|Passed)$/i.test(original['Historical status']) ? 'Pass' : original['Historical status'];
  assert.equal(row.Status, status, 'Historical result must match source');
  assert.equal(row.Actual, original['Historical actual'] || 'Not recorded in original result', 'Do not invent historical actual');
}
const useCases = JSON.parse(readFileSync(resolve(root, 'manual-testing/rtm/use-cases.json'), 'utf8'));
assert.equal(useCases.length, 20);
for (const item of useCases) {
  assert.ok(reconciliation.excel.useCases[item.id] > 0, `Unknown use case ${item.id}`);
  assert.ok(Number.isInteger(item.specPage) && item.specPage > 0);
  item.implementation.forEach((file) => readFileSync(resolve(root, file)));
}
for (const [id, targets] of Object.entries(links)) {
  assert.ok(ids.has(id), `Unknown focused case ${id}`);
  targets.forEach((target) => assert.ok(sourceIds.has(target), `Unknown source case ${target}`));
}
const defects = JSON.parse(readFileSync(resolve(root, 'manual-testing/bug-reports/registry.json'), 'utf8')).defects;
assert.equal(new Set(defects.map((defect) => defect.id)).size, defects.length, 'Duplicate bug ID');
for (const defect of defects) {
  assert.ok(defect.title && defect.owner && defect.severity && /^P[0-3]$/.test(defect.priority), 'Incomplete defect');
  assert.equal(defect.history.at(-1).state, defect.state, 'Defect state/history mismatch');
  defect.testCaseIds.forEach((id) => assert.ok(ids.has(id) || sourceIds.has(id), `Unknown defect case ${id}`));
}
const latest = JSON.parse(readFileSync(resolve(root, 'manual-testing/test-execution/latest-qa-summary.json'), 'utf8'));
const currentRun = JSON.parse(readFileSync(resolve(root, latest.business.report), 'utf8'));
assert.deepEqual(latest.business.counts, currentRun.counts, 'Latest summary differs from published business report');
assert.equal(latest.business.runId, currentRun.runId);
const currentUnit = JSON.parse(readFileSync(resolve(root, latest.unit.report), 'utf8'));
assert.deepEqual(latest.unit.counts, currentUnit.counts, 'Latest unit counts differ');
const currentPostman = JSON.parse(readFileSync(resolve(root, latest.postman.report), 'utf8'));
assert.deepEqual(latest.postman.stats, currentPostman.stats, 'Latest Newman statistics differ');
assert.deepEqual(latest.defects, defects.map(({ id, state, severity, priority }) => ({ id, state, severity, priority })), 'Latest defect summary is stale');
assert.equal(latest.manual.sha256, createHash('sha256').update(readFileSync(resolve(root, latest.manual.workbook))).digest('hex'), 'Manual workbook changed: regenerate latest summary');
if (latest.ci) {
  const verification = JSON.parse(readFileSync(resolve(root, latest.ci.report), 'utf8'));
  assert.deepEqual(verification.counts, currentRun.counts, 'CI/local summary counts differ');
  assert.equal(verification.workflowRunId, latest.ci.workflowRunId);
}
console.log(`QA audit passed: ${source.length} original designs / 20 use cases; ${cases.length} overlapping focused designs / ${rtm.length} requirements; source hashes and bug links valid.`);
