const { readFileSync, writeFileSync, existsSync } = require('node:fs');
const { resolve, relative } = require('node:path');
const Excel = require('../../server/node_modules/exceljs');
const { root, hash } = require('../helpers/run-store');
const { parseCsv, csv } = require('../helpers/tabular');
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const jsonLines = (path) => existsSync(path) ? readFileSync(path, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse) : [];
const slash = (path) => path.replace(/\\/g, '/');
const statusOrder = (values) => values.includes('Fail') ? 'Fail' : values.includes('Blocked') ? 'Blocked' : values.includes('Pass') ? 'Pass' : 'Not Run';
async function reportRun(directory) {
  if (existsSync(resolve(directory, 'execution.json'))) throw new Error('Completed execution reports are immutable; create a new Run ID');
  const manifest = readJson(resolve(directory, 'run.json'));
  const focused = parseCsv(readFileSync(resolve(root, 'testing/manual/test-cases.csv'), 'utf8'));
  const source = parseCsv(readFileSync(resolve(root, 'testing/manual/source-cases.csv'), 'utf8'));
  const links = readJson(resolve(root, 'testing/trace-links.json'));
  const results = [];
  for (const suite of ['api', 'known-defects', 'ui']) {
    for (const result of jsonLines(resolve(directory, suite, 'results.jsonl'))) {
      const ids = [...new Set(result.name.match(/TC-(?:AUTHZ|AUTH|APPT|PAY)-\d{3}/g) || [])];
      const evidenceFile = resolve(directory, suite, 'observations', `${hash(result.name).slice(0, 12)}.json`);
      const observations = existsSync(evidenceFile) ? readJson(evidenceFile) : result.observations || [];
      const resultFile = slash(relative(directory, resolve(directory, suite, 'results.jsonl')));
      const matching = focused.filter((item) => ids.includes(item.ID));
      results.push({ runId: manifest.runId, executedAt: manifest.started,
        build: `${manifest.applicationVersion}@${manifest.commit.slice(0, 12)}+${manifest.workingTreeHash.slice(0, 12)}`,
        executor: manifest.executor, automationId: `${suite.toUpperCase()}-${hash(result.name).slice(0, 12)}`,
        testCaseIds: ids, sourceCaseIds: [...new Set(ids.flatMap((id) => links[id] || []))],
        name: result.name, suite, status: result.status,
        expected: matching.length ? matching.map((item) => `${item.ID}: ${item.Expected}`).join(' | ') : result.name,
        actual: JSON.stringify({ observations, assertionOutcome: result.status, error: result.error || null }),
        bugIds: [...new Set([...(result.name.match(/BUG-\d{3}/g) || []), ...(ids.includes('TC-AUTH-005') ? ['BUG-001'] : [])])], durationMs: result.durationMs,
        evidence: [resultFile, ...(existsSync(evidenceFile) ? [slash(relative(directory, evidenceFile))] : []), ...(result.screenshots || [])],
        coverage: 'Partial: automated assertions only; manual status remains separate' });
    }
    const metadata = resolve(directory, suite, 'suite.json');
    if (existsSync(metadata)) {
      const suiteResult = readJson(metadata);
      if (suiteResult.exitCode !== 0 && !results.some((item) => item.suite === suite && item.status === 'Fail')) {
        results.push({ runId: manifest.runId, name: `${suite}: infrastructure/reporting failure`, suite, status: 'Fail',
          testCaseIds: [], sourceCaseIds: [], evidence: [`${suite}/suite.json`], actual: JSON.stringify(suiteResult), bugIds: [] });
      }
    }
  }
  for (const outcome of manifest.outcomes || []) {
    if (outcome.exitCode !== 0 && !results.some((item) => item.suite === outcome.suite && item.status === 'Fail')) {
      results.push({ runId: manifest.runId, name: `${outcome.suite}: process failed outside test assertions`,
        suite: outcome.suite, status: 'Fail', testCaseIds: [], sourceCaseIds: [], bugIds: [],
        evidence: [`${outcome.suite}.log`], actual: `Exit code ${outcome.exitCode}` });
    }
  }
  for (const item of results) {
    item.executedAt ||= manifest.started;
    item.build ||= `${manifest.applicationVersion}@${manifest.commit.slice(0, 12)}+${manifest.workingTreeHash.slice(0, 12)}`;
    item.executor ||= manifest.executor;
    item.automationId ||= `${item.suite.toUpperCase()}-${hash(item.name).slice(0, 12)}`;
    item.expected ||= 'Process completes with a valid test report';
    item.coverage ||= 'Infrastructure failure; no business case claimed';
  }
  const counts = Object.fromEntries(['Pass', 'Fail', 'Blocked', 'Not Run'].map((status) => [status, results.filter((item) => item.status === status).length]));
  writeFileSync(resolve(directory, 'execution.json'), JSON.stringify({ ...manifest, counts, results }, null, 2) + '\n');
  const fields = ['runId', 'executedAt', 'build', 'executor', 'automationId', 'testCaseIds', 'sourceCaseIds', 'name', 'suite', 'expected', 'actual', 'status', 'bugIds', 'evidence', 'durationMs', 'coverage'];
  const table = results.map((item) => Object.fromEntries(fields.map((key) => [key, Array.isArray(item[key]) ? item[key].join(' | ') : item[key] ?? ''])));
  writeFileSync(resolve(directory, 'execution.csv'), '\uFEFF' + csv(table, fields));
  const trace = [...source.map((item) => ({ item, inventory: 'Original 337', useCase: item['Use case'] })),
    ...focused.map((item) => ({ item, inventory: 'Focused 70', useCase: `FOCUSED-${item.ID.split('-')[1]}` }))]
    .map(({ item, inventory, useCase }) => {
      const hits = results.filter((result) => (inventory === 'Original 337' ? result.sourceCaseIds : result.testCaseIds).includes(item.ID));
      return { 'Run ID': manifest.runId, Inventory: inventory, 'Use case': useCase, 'Test Case ID': item.ID,
        Priority: item.Priority, 'Manual status': 'Not Run', 'Automation status': statusOrder(hits.map((hit) => hit.status)),
        'Automation coverage': hits.length ? 'Partial; not full manual execution' : 'Not covered this run',
        'Bug IDs': [...new Set(hits.flatMap((hit) => hit.bugIds))].join(' | '),
        Evidence: [...new Set(hits.flatMap((hit) => hit.evidence))].join(' | ') };
    });
  writeFileSync(resolve(directory, 'traceability.csv'), '\uFEFF' + csv(trace));
  const workbook = new Excel.Workbook();
  for (const [name, rows] of [['Execution', table], ['Traceability', trace]]) {
    const sheet = workbook.addWorksheet(name);
    const headers = Object.keys(rows[0] || {});
    sheet.columns = headers.map((key) => ({ header: key, key, width: /actual|expected|Evidence/.test(key) ? 60 : 25 }));
    sheet.addRows(rows); sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.getRow(1).font = { bold: true };
    if (headers.length) sheet.autoFilter = { from: 'A1', to: { row: rows.length + 1, column: headers.length } };
  }
  await workbook.xlsx.writeFile(resolve(directory, 'execution.xlsx'));
  const summary = `# Test Run ${manifest.runId}\n\nBuild: ${manifest.applicationVersion} / ${manifest.commit}. Source hash: ${manifest.workingTreeHash}.\n\nExecutor: ${manifest.executor}. Started: ${manifest.started}.\n\n| Status | Count |\n| --- | ---: |\n${Object.entries(counts).map(([status, count]) => `| ${status} | ${count} |`).join('\n')}\n\nManual: 337 original designs and 70 overlapping focused designs remain Not Run. Automation mappings are partial, not full manual Pass.\n\n[Execution CSV](execution.csv) · [Excel](execution.xlsx) · [RTM with results](traceability.csv) · [JSON](execution.json)\n`;
  writeFileSync(resolve(directory, 'summary.md'), summary + '\n' + require('../helpers/suite-summary').suiteSummary(results)
    + '\n\nEvery failing business assertion still fails CI, including defect regression.\n');
  return { manifest, counts, results };
}
if (require.main === module) reportRun(resolve(process.argv[2])).catch((error) => { console.error(error); process.exitCode = 1; });
module.exports = { reportRun };
