const Excel = require('../../../server/node_modules/exceljs');
const { mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } = require('node:fs');
const { resolve } = require('node:path');
const { csv } = require('./tabular');

async function exportHistoricalExecution(root, cases, reconciliation) {
  const directory = resolve(root, 'manual-testing/test-execution/history');
  mkdirSync(directory, { recursive: true });
  const rows = cases.map((item) => ({
    'Record ID': 'HIST-EXCEL-20260614',
    'Test Case ID': item.ID, 'Use case': item['Use case'],
    'Last tested (sheet note)': item['Historical last tested'] || 'Not recorded',
    Build: item['Historical build'] || 'Not recorded for this case',
    Executor: 'Not recorded per case; QA assignment in test-report PDF page 2',
    Description: item.Description, Priority: item.Priority, 'Original priority': item['Original priority'],
    Steps: (item['Original steps'] ?? item.Steps) || 'Not recorded', Expected: (item['Original expected'] ?? item.Expected) || 'Not recorded',
    Actual: item['Historical actual'] || 'Not recorded in original result',
    Status: /^(Passed|Pass)$/i.test(item['Historical status']) ? 'Pass' : item['Historical status'],
    'Original status': item['Historical status'],
    'Original remarks': item['Historical remarks'],
    'Source bug reference': (item['Historical remarks'].match(/Bug\s*#\s*\d+/ig) || []).join('; '),
    Evidence: `${item['Source file']} | ${item['Source sheet']} | row ${item['Source row']}`,
    'Evidence type': 'Original recorded test result; not a newly captured screenshot/log',
    'Review notes': [item['Design review'].startsWith('Needs review') ? item['Design review'] : '',
      !item['Historical actual'] ? 'Original actual result missing; not replaced with expected' : ''].filter(Boolean).join('; '),
  }));
  writeFileSync(resolve(directory, 'manual-execution.csv'), '\uFEFF' + csv(rows));
  const useCases = JSON.parse(readFileSync(resolve(root, 'manual-testing/rtm/use-cases.json'), 'utf8'));
  const published = resolve(root, 'automation-testing/reports/runs');
  const runs = readdirSync(published, { withFileTypes: true }).filter((entry) => entry.isDirectory())
    .map((entry) => resolve(published, entry.name, 'execution.json')).filter(existsSync)
    .map((file) => JSON.parse(readFileSync(file, 'utf8'))).filter((run) => run.label === 'all')
    .sort((a, b) => b.started.localeCompare(a.started));
  const latest = runs[0];
  const trace = cases.map((item) => {
    const uc = useCases.find((entry) => entry.id === item['Use case']);
    if (!uc) throw new Error(`Missing original use case ${item['Use case']}`);
    const results = latest?.results.filter((result) => result.sourceCaseIds.includes(item.ID)) || [];
    return { 'Use case': uc.id, Name: uc.name, 'Specification': `docs/requirements/LT2_N02_DacTa.pdf#page=${uc.specPage}`,
      'Implementation reference': uc.implementation.join(' | '), 'Test Case ID': item.ID,
      'Historical result': rows.find((row) => row['Test Case ID'] === item.ID).Status,
      'Historical evidence': `${item['Source file']} | ${item['Source sheet']} | row ${item['Source row']}`,
      'Latest automation': results.some((result) => result.status === 'Fail') ? 'Fail (Partial)' : results.length ? 'Pass (Partial)' : 'Not covered',
      'Latest run': latest?.runId || 'Not recorded',
      'Current evidence': results.length ? `automation-testing/reports/runs/${latest.runId}/execution.json` : '',
      'Coverage note': 'Historical result is from original Excel; related automation does not replace complete manual execution' };
  });
  writeFileSync(resolve(root, 'manual-testing/rtm/historical-rtm.csv'), '\uFEFF' + csv(trace));
  const book = new Excel.Workbook();
  book.creator = 'SmileCare QA';
  const overview = book.addWorksheet('Overview');
  overview.addRows([
    ['Record', 'Total', 'Pass', 'Fail', 'Interpretation'],
    ['HIST-EXCEL-20260614', rows.length, rows.filter((row) => row.Status === 'Pass').length, rows.filter((row) => row.Status === 'Fail').length, 'Imported completed results from original Excel. Date comes from sheet note; not an original Run ID.'],
    ['HIST-PDF-202606', reconciliation.pdf.reportedTotal, reconciliation.pdf.reportedPassed, reconciliation.pdf.reportedFailed, 'Original PDF table 3-1, PDF page 36. Aggregate only; do not assign its 26 failures to arbitrary case IDs.'],
  ]);
  const sheet = book.addWorksheet('Historical Excel results');
  sheet.columns = Object.keys(rows[0]).map((key) => ({ header: key, key, width: /Expected|Actual|Evidence|Steps|notes/.test(key) ? 65 : 28 }));
  sheet.addRows(rows);
  const groups = book.addWorksheet('Use case summary');
  groups.addRow(['Use case', 'Total', 'Pass', 'Fail']);
  for (const uc of Object.keys(reconciliation.excel.useCases).sort()) {
    const matches = rows.filter((row) => row['Use case'] === uc);
    groups.addRow([uc, matches.length, matches.filter((row) => row.Status === 'Pass').length, matches.filter((row) => row.Status === 'Fail').length]);
  }
  const rtm = book.addWorksheet('Traceability');
  rtm.columns = Object.keys(trace[0]).map((key) => ({ header: key, key, width: /evidence|reference|note|Specification/.test(key) ? 65 : 28 }));
  rtm.addRows(trace);
  book.eachSheet((page) => {
    page.views = [{ state: 'frozen', ySplit: 1 }];
    page.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    page.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF17365D' } };
    page.eachRow((row) => { row.alignment = { vertical: 'top', wrapText: true }; });
    if (page.columnCount) page.autoFilter = { from: 'A1', to: { row: page.rowCount, column: page.columnCount } };
  });
  await book.xlsx.writeFile(resolve(directory, 'manual-execution.xlsx'));
}
module.exports = { exportHistoricalExecution };
