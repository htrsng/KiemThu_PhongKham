// Retain original workbooks/PDFs; historical Pass labels are never execution evidence.
const Excel = require('../../server/node_modules/exceljs');
const { readFileSync, writeFileSync, readdirSync } = require('node:fs');
const { resolve, relative } = require('node:path');
const { createHash } = require('node:crypto');
const { parseCsv, csv } = require('../helpers/tabular');
const root = resolve(__dirname, '../..');
const text = (value) => value == null ? '' : typeof value === 'object'
  ? value.text || value.richText?.map((part) => part.text).join('') || String(value.result ?? '') : String(value);
async function main() {
  const source = readdirSync(resolve(root, 'docs')).filter((name) => name.endsWith('.xlsx'));
  if (source.length !== 1) throw new Error('Expected exactly one original test-case workbook in docs/.');
  const file = `docs/${source[0]}`;
  const workbook = new Excel.Workbook();
  await workbook.xlsx.readFile(resolve(root, file));
  const cases = [], issues = [], totals = {};
  const releaseRisks = new Set(['TC-UC11-002', 'TC-UC11-020', 'TC-UC24-001', 'TC-UC24-004', 'TC-UC24-006', 'TC-UC24-010',
    'TC-UC31-001', 'TC-UC31-006', 'TC-UC31-010', 'TC-UC33-001', 'TC-UC33-004', 'TC-UC33-008', 'TC-UC33-010', 'TC-UC33-013', 'TC-UC33-016']);
  workbook.eachSheet((sheet) => {
    sheet.eachRow((row, number) => {
      const id = text(row.getCell(1).value).trim();
      if (!/^TC-UC\d+-\d+$/.test(id)) return;
      const value = (index) => text(row.getCell(index).value).trim();
      const uc = value(2).replace(/\s+/g, '');
      const missing = [[5, 'Description'], [6, 'Steps'], [7, 'Step expected'], [8, 'Input'], [9, 'Overall expected']]
        .filter(([index]) => !value(index)).map(([, label]) => label);
      if (missing.length) issues.push({ id, sheet: sheet.name, row: number, missing });
      totals[uc] = (totals[uc] || 0) + 1;
      cases.push({ ID: id, 'Use case': uc, Description: value(5),
        Priority: releaseRisks.has(id) ? 'P0' : ({ High: 'P1', Medium: 'P2', Low: 'P3' })[value(3)] || 'Needs review',
        'Original priority': value(3), Technique: value(4), Steps: value(6), 'Test data': value(8),
        Expected: value(9) || value(7), 'Step expected': value(7),
        'Design review': missing.length ? `Needs review: ${missing.join(', ')}` : 'Imported; not validated against implementation',
        'Historical status': value(11), 'Historical actual': value(10), 'Historical remarks': value(12),
        'Current status': 'Not Run', 'Source file': file, 'Source sheet': sheet.name, 'Source row': number });
    });
  });
  if (new Set(cases.map((item) => item.ID)).size !== cases.length) throw new Error('Duplicate source case IDs');
  writeFileSync(resolve(root, 'testing/manual/source-cases.csv'), '\uFEFF' + csv(cases));
  const sources = readdirSync(resolve(root, 'docs')).filter((name) => /\.(pdf|xlsx)$/.test(name)).sort()
    .map((name) => ({ file: `docs/${name}`, sha256: createHash('sha256').update(readFileSync(resolve(root, 'docs', name))).digest('hex') }));
  // Counts transcribed from PDF pages 26/34/35/36, independently reviewed against extracted text.
  const pdfSummary = { UC1: 70, UC2: 92, UC3: 80, UC4: 72 };
  const groups = Object.fromEntries(Object.keys(pdfSummary).map((group) => [group,
    cases.filter((item) => item['Use case'].startsWith(group + '.')).length]));
  const reconciliation = { sources, excel: { total: cases.length, unique: cases.length, useCases: totals, groups,
    historicalPassLabels: cases.filter((item) => /^(Pass|Passed)$/i.test(item['Historical status'])).length },
    pdf: { file: 'docs/LT2_N02_KiemThu.pdf', summaryPage: 26, executionPage: 36,
      summary: pdfSummary, reportedTotal: 314, reportedPassed: 288, reportedFailed: 26,
      detailedUc4Count: 92, detailedUc4Pages: [33, 34, 35] },
    differences: Object.fromEntries(Object.keys(groups).map((group) => [group, groups[group] - pdfSummary[group]])),
    designIssues: issues, disposition: 'Excel is the 337-case design baseline. Historical PDF/Excel results are unverified, inconsistent snapshots, not a new run. No evidence establishes separate execution versions.',
    priorityPolicy: '15 role/booking/check-in/payment risks are P0. Other High -> P1, Medium -> P2, Low -> P3; original labels are retained separately.' };
  writeFileSync(resolve(root, 'docs/qa/source-reconciliation.json'), JSON.stringify(reconciliation, null, 2) + '\n');
  const output = new Excel.Workbook();
  output.creator = 'SmileCare QA';
  const instructions = output.addWorksheet('Summary');
  instructions.addRows([['Inventory', 'Count', 'Execution status'], ['Original designs', cases.length, 'All Not Run'],
    ['Focused regression designs', 70, 'Separate overlapping designs, not 407 independent scenarios'],
    ['Historical labels', reconciliation.excel.historicalPassLabels, 'Not verified; excluded from current Pass count'],
    ['Priority', '', reconciliation.priorityPolicy], ['Actual execution', '', 'Stored per Run ID; do not replace manual results with automation.']]);
  const focused = parseCsv(readFileSync(resolve(root, 'testing/manual/test-cases.csv'), 'utf8'));
  for (const [name, data] of [['Source designs', cases], ['Focused designs', focused]]) {
    const sheet = output.addWorksheet(name);
    const headers = ['Run ID', 'Executed at', 'Build', 'Executor', 'Test Case ID', 'Priority', 'Expected', 'Actual', 'Status', 'Bug ID', 'Evidence'];
    sheet.addRow(headers);
    for (const item of data) sheet.addRow(['', '', '', '', item.ID, item.Priority, item.Expected, '', 'Not Run', '', '']);
    sheet.views = [{ state: 'frozen', ySplit: 1 }]; sheet.autoFilter = `A1:K${data.length + 1}`;
    for (let i = 2; i <= data.length + 1; i++) sheet.getCell(`I${i}`).dataValidation = {
      type: 'list', allowBlank: false, formulae: ['"Pass,Fail,Blocked,Not Run"'], showErrorMessage: true, errorStyle: 'stop' };
  }
  output.eachSheet((sheet) => {
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF17365D' } };
    sheet.columns.forEach((column) => { column.width = 26; });
    sheet.eachRow((row) => { row.alignment = { vertical: 'top', wrapText: true }; });
  });
  const destination = process.argv.find((arg) => arg.startsWith('--workbook='))?.slice(11);
  // Explicit output is required so a maintainer cannot overwrite filled manual results accidentally.
  if (destination) {
    if (resolve(root, destination) === resolve(root, file)) throw new Error('Refusing to overwrite the original workbook');
    await output.xlsx.writeFile(resolve(root, destination));
  }
  console.log(`Normalized ${cases.length} cases across ${Object.keys(totals).length} use cases; ${issues.length} designs need field review.`);
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
