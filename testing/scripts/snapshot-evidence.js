// Publish only a small, credential-checked selection of an actual local run.
const { readFileSync, writeFileSync, copyFileSync, mkdirSync, readdirSync } = require('node:fs');
const { resolve } = require('node:path');
const { createHash } = require('node:crypto');
const root = resolve(__dirname, '../..');
const run = process.argv[2];
if (!/^\d{4}-\d{2}-\d{2}$/.test(run || '')) throw new Error('Usage: snapshot-evidence.js YYYY-MM-DD');
const out = resolve(root, 'docs/qa/evidence', run);
mkdirSync(out, { recursive: true });
function publish(file, data) {
  const value = typeof data === 'string' ? data : JSON.stringify(data, null, 2) + '\n';
  for (const key of ['ADMIN_PASS', 'DOCTOR_PASS', 'RECEPTION_PASS', 'JWT_SECRET']) {
    if (process.env[key] && value.includes(process.env[key])) throw new Error(`Secret detected in ${file}`);
  }
  if (/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(value)) throw new Error(`JWT detected in ${file}`);
  writeFileSync(resolve(out, file), value);
}
for (const suite of ['api', 'known-defects']) {
  for (const file of ['results.tap', 'junit.xml', 'manifest.json']) {
    publish(`${suite}-${file}`, readFileSync(resolve(root, 'testing/artifacts', suite, file), 'utf8'));
  }
}
const reportDir = resolve(root, 'testing/e2e/cypress/reports/.jsons');
const reports = readdirSync(reportDir).filter((name) => /^mochawesome.*\.json$/.test(name))
  .map((name) => JSON.parse(readFileSync(resolve(reportDir, name), 'utf8')));
function tests(suite) {
  return [...(suite.tests || []).map(({ title, state, duration, err }) => ({ title, state, duration, error: err?.message || null })),
    ...(suite.suites || []).flatMap(tests)];
}
publish('cypress-results.json', { note: 'Summary extracted from real Mochawesome reports; raw HTML/video remain in local artifacts.',
  reports: reports.map((report) => ({ stats: report.stats, tests: report.results.flatMap(tests) })) });
const files = ['testing/e2e/cypress.config.js', 'testing/e2e/cypress/e2e/login.cy.js', 'testing/e2e/cypress/e2e/core-workflows.cy.js',
  'testing/e2e/cypress/support/commands.js', 'testing/helpers/qa-data.js', 'server/server.js',
  'server/src/controllers/appointmentController.js', 'server/src/routes/appointmentRoutes.js', 'server/src/routes/invoiceRoutes.js'];
publish('source-hashes.json', Object.fromEntries(files.map((file) => [file,
  createHash('sha256').update(readFileSync(resolve(root, file))).digest('hex')])));
for (const name of ['reception-checkin-persisted', 'invoice-detail']) {
  copyFileSync(resolve(root, `testing/e2e/cypress/screenshots/core-workflows.cy.js/${name}.png`), resolve(out, `${name}.png`));
}
console.log(`Saved selected evidence under docs/qa/evidence/${run}; review screenshots before publishing.`);
