// Creates a new execution template; never replaces a filled workbook.
const Excel = require('../../../server/node_modules/exceljs');
const { readFileSync, existsSync, writeFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { parseCsv, csv } = require('../helpers/tabular');
const root = resolve(__dirname, '../../..');
const selected = {
  AUTH: [1, 2, 3, 4, 5, 8, 9, 11], AUTHZ: [1, 2, 3, 4, 5, 7],
  APPT: [1, 2, 3, 9, 11, 13, 14, 15, 16, 18, 19, 20, 21, 22],
  PAY: [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 16, 17],
};
async function main() {
  const destination = resolve(root, process.argv.find((arg) => arg.startsWith('--output='))?.slice(9) || 'manual-testing/test-execution/manual-regression.xlsx');
  if (existsSync(destination)) throw new Error('Output already exists. Use --output=manual-testing/test-execution/<new-run>.xlsx to preserve previous execution.');
  const cases = parseCsv(readFileSync(resolve(root, 'manual-testing/test-cases/test-cases.csv'), 'utf8'));
  const links = JSON.parse(readFileSync(resolve(root, 'manual-testing/rtm/trace-links.json'), 'utf8'));
  const rows = Object.entries(selected).flatMap(([group, numbers]) => numbers.map((number) => {
    const id = `TC-${group}-${String(number).padStart(3, '0')}`;
    const item = cases.find((row) => row.ID === id);
    if (!item) throw new Error(`Missing case ${id}`);
    return { 'Run ID': '', 'Build commit': '', 'Executed at': '', Executor: '', 'Test Case ID': id,
      'Related original IDs': (links[id] || []).join(' | '), Priority: item.Priority,
      Description: item.Description, Precondition: item.Precondition, 'Planned data': item['Test data'],
      'Actual data / IDs': '', Steps: item.Steps,
      Expected: id === 'TC-PAY-003' ? item.Expected + '; GET hóa đơn xác nhận amountPaid = finalAmount, phương thức Tiền mặt; không tạo hóa đơn mới (BUG-004)' : item.Expected,
      Actual: '', Status: 'Not Run', 'Bug ID': ({ 'TC-APPT-021': 'BUG-002', 'TC-APPT-022': 'BUG-003', 'TC-PAY-003': 'BUG-004' })[id] || '',
      Evidence: '' };
  }));
  const book = new Excel.Workbook();
  const info = book.addWorksheet('Run setup');
  info.addRows([['Field', 'Value'], ['Run ID', 'MAN-YYYYMMDD-01 (fill before execution)'],
    ['Build commit', 'Run git rev-parse HEAD; copy full hash'], ['Executor / date / timezone', 'Fill your name and actual execution time'],
    ['Environment', 'Local UI http://localhost:5173; API http://localhost:5000/api; database ending _test'],
    ['Data', 'Only synthetic data. Record actual IDs and invoice totals for each case.'],
    ['Statuses', 'Pass only after observed expected result; Fail with bug/evidence; Blocked with reason; untouched cases stay Not Run'],
    ['Evidence', 'Save screenshots and relevant Network response under manual-testing/test-execution/manual-runs/<Run ID>/; redact tokens/passwords'],
    ['Scope', '40 priority cases derived from overlapping focused designs; not a retest of all 337 historical cases']]);
  const sheet = book.addWorksheet('Execution');
  sheet.columns = Object.keys(rows[0]).map((key) => ({ header: key, key, width: /Steps|Expected|Actual|Precondition|data/.test(key) ? 55 : 25 }));
  sheet.addRows(rows);
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = { from: 'A1', to: { row: 41, column: sheet.columnCount } };
  for (let row = 2; row <= 41; row++) sheet.getCell(row, 15).dataValidation = {
    type: 'list', formulae: ['"Pass,Fail,Blocked,Not Run"'], showErrorMessage: true, errorStyle: 'stop' };
  book.eachSheet((page) => {
    page.getRow(1).font = { bold: true };
    page.eachRow((row) => { row.alignment = { wrapText: true, vertical: 'top' }; });
  });
  await book.xlsx.writeFile(destination);
  writeFileSync(resolve(root, 'manual-testing/test-cases/regression-suite.csv'), '\uFEFF' + csv(rows));
  console.log(`Prepared ${rows.length} manual cases, all Not Run: ${destination}`);
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
