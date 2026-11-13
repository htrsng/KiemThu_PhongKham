const assert = require('node:assert/strict');
function parseCsv(text) {
  const rows = []; let row = [], field = '', quoted = false;
  text = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (!quoted && (ch === ',' || ch === '\n')) {
      row.push(field); field = '';
      if (ch === '\n') { rows.push(row); row = []; }
    } else field += ch;
  }
  assert.ok(!quoted, 'Unclosed CSV quote');
  if (field || row.length) { row.push(field); rows.push(row); }
  const headers = rows.shift();
  assert.ok(headers?.length, 'Missing CSV headers');
  return rows.map((values) => {
    assert.equal(values.length, headers.length, 'Invalid CSV column count');
    return Object.fromEntries(headers.map((key, i) => [key, values[i]]));
  });
}
function csv(rows, headers = Object.keys(rows[0] || {})) {
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  return [headers, ...rows.map((row) => headers.map((key) => row[key]))].map((row) => row.map(escape).join(',')).join('\n') + '\n';
}
module.exports = { parseCsv, csv };
