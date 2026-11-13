// Newman runs the same importable collection. Credentials live only in memory.
const newman = require('../postman/node_modules/newman');
const { readFileSync, writeFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { createHash } = require('node:crypto');
const { createRun, root } = require('../helpers/run-store');
const { assertLocalQa, createFixture, cleanupAll } = require('../helpers/qa-data');
const { redact } = require('../helpers/redact');
async function main() {
  assertLocalQa();
  const run = createRun('postman');
  try {
    const data = await createFixture({ appointment: false });
    const existing = await createFixture({ status: 'Đã hoàn thành', invoice: true });
    const collectionPath = resolve(root, 'testing/postman/smilecare-qa.postman_collection.json');
    const collectionText = readFileSync(collectionPath, 'utf8');
    const values = { baseUrl: process.env.API_URL || 'http://localhost:5000/api',
      adminEmail: process.env.ADMIN_USER, adminPassword: process.env.ADMIN_PASS,
      doctorEmail: process.env.DOCTOR_USER, doctorPassword: process.env.DOCTOR_PASS,
      receptionEmail: process.env.RECEPTION_USER, receptionPassword: process.env.RECEPTION_PASS,
      patientId: data.appointment.patientId, doctorId: data.appointment.doctorId, serviceId: data.appointment.serviceId,
      futureStartTime: data.appointment.startTime, futureEndTime: data.appointment.endTime,
      invoiceId: existing.invoiceId, amount: '100000' };
    const summary = await new Promise((accept, reject) => newman.run({
      collection: JSON.parse(collectionText), environment: { values: Object.entries(values).map(([key, value]) => ({ key, value, enabled: true })) },
      reporters: [], timeoutRequest: 10000,
    }, (error, result) => error ? reject(error) : accept(result)));
    const results = summary.run.executions.map((execution) => {
      let body;
      try { body = JSON.parse(execution.response?.stream.toString() || '{}'); } catch { body = {}; }
      const observation = {};
      for (const key of ['status', 'amountPaid', 'finalAmount', 'debt', 'paymentMethod', 'checkInTime']) {
        if (body.data && !Array.isArray(body.data) && body.data[key] !== undefined) observation[key] = body.data[key];
      }
      if (Array.isArray(body.data)) observation.recordCount = body.data.length;
      return { request: execution.item.name, method: execution.request.method,
        httpStatus: execution.response?.code ?? null, durationMs: execution.response?.responseTime ?? null,
        observations: observation, assertions: (execution.assertions || []).map((item) => ({
          name: item.assertion, status: item.skipped ? 'Not Run' : item.error ? 'Fail' : 'Pass',
          error: item.error ? redact(item.error.message) : null })) };
    });
    run.manifest.finished = new Date().toISOString();
    const failures = summary.run.failures.map((item) => ({ source: item.source?.name || '',
      test: item.error?.test || item.error?.name || 'Request/script failure', message: redact(item.error?.message || '') }));
    const report = { ...run.manifest, tool: `Newman ${require('../postman/node_modules/newman/package.json').version}`,
      collection: 'testing/postman/smilecare-qa.postman_collection.json',
      collectionSha256: createHash('sha256').update(collectionText).digest('hex'),
      stats: summary.run.stats, failures, results,
      disclosure: 'Executed by Newman, not a manual Postman GUI run. Requests, tokens, environment values and full responses intentionally excluded from evidence.' };
    writeFileSync(resolve(run.directory, 'run.json'), JSON.stringify(run.manifest, null, 2) + '\n');
    writeFileSync(resolve(run.directory, 'newman-results.json'), JSON.stringify(report, null, 2) + '\n');
    const assertions = summary.run.stats.assertions;
    const text = `# Postman / Newman execution\n\nRun: ${run.manifest.runId}\n\nBuild: ${run.manifest.commit}; source hash: ${run.manifest.workingTreeHash}\n\n${summary.run.stats.requests.total} requests; ${assertions.total - assertions.failed}/${assertions.total} assertions passed; ${failures.length} failures.\n\n`;
    writeFileSync(resolve(run.directory, 'summary.md'), text + report.disclosure + '\n');
    console.log(text + `Evidence: ${run.directory}`);
    if (process.env.GITHUB_STEP_SUMMARY) require('node:fs').appendFileSync(process.env.GITHUB_STEP_SUMMARY, '\n' + text);
    process.exitCode = failures.length || assertions.failed ? 1 : 0;
  } finally { await cleanupAll(); }
}
main().catch((error) => { console.error(redact(error.message)); process.exitCode = 1; });
