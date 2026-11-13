// Validate traceability and required fields without counting designs as execution.
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const assert = require('node:assert/strict');
const root = resolve(__dirname, '../..');
function rows(file) {
  const lines = readFileSync(resolve(root, file), 'utf8').replace(/^\uFEFF/, '').trimEnd().split(/\r?\n/);
  const headers = lines.shift().split('\t');
  return lines.map((line) => {
    const fields = line.split('\t');
    assert.equal(fields.length, headers.length, `Invalid columns in ${file}`);
    return Object.fromEntries(headers.map((key, index) => [key, fields[index]]));
  });
}
const cases = rows('testing/manual/test-cases.tsv');
const rtm = rows('docs/qa/rtm.tsv');
const ids = new Set(cases.map((row) => row.ID));
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
const csv = csvRecords(readFileSync(resolve(root, 'testing/manual/test-cases.csv'), 'utf8'));
const headers = Object.keys(cases[0]);
assert.deepEqual(csv, [headers, ...cases.map((row) => headers.map((key) => row[key]))], 'CSV/TSV differ');
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
console.log(`QA audit passed: ${cases.length} unique designs; ${rtm.length} requirements; every case mapped. Runtime coverage is separate.`);
