const { defineConfig } = require('cypress');
const { mkdirSync, appendFileSync, writeFileSync, readFileSync, readdirSync } = require('node:fs');
const { resolve, relative } = require('node:path');
const { activeRun } = require('../.github/qa/helpers/run-store');
const { redact } = require('../.github/qa/helpers/redact');
const { mergeCypressResults } = require('../.github/qa/helpers/cypress-results');
const run = activeRun('ui');
const uiDirectory = resolve(run.directory, 'ui');
mkdirSync(uiDirectory);
const observed = new Map();

module.exports = defineConfig({
  e2e: {
    testIsolation: true,
    baseUrl: process.env.BASE_URL || 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    fixturesFolder: 'fixtures',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 8000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    video: true,
    videosFolder: resolve(uiDirectory, 'videos'),
    screenshotsFolder: resolve(uiDirectory, 'screenshots'),
    screenshotOnRunFailure: true,
    retries: {
      runMode: 0,
      openMode: 0
    },
    reporter: 'cypress-mochawesome-reporter',
    reporterOptions: {
      reportDir: resolve(uiDirectory, 'report'),
      overwrite: false,
      removeJsonsFolderAfterMerge: false,
      html: true,
      json: true
    },
    setupNodeEvents(on, config) {
      const { beforeRunHook, afterRunHook } = require('cypress-mochawesome-reporter/lib');
      const fixtures = require('./fixtures/qa-data');
      on('before:run', beforeRunHook);
      on('task', {
        'qa:create': fixtures.createFixture,
        'qa:cleanup': fixtures.cleanupAll,
        'qa:observe'({ name, data }) {
          observed.set(name, [...(observed.get(name) || []), data]);
          return null;
        },
      });
      on('after:spec', (spec, results) => {
        if (!results) return;
        for (const test of results.tests || []) {
          const name = test.title.at(-1);
          const last = test.attempts?.at(-1);
          const titleKey = name.replace(/\W/g, '').toLowerCase();
          const screenshots = (results.screenshots || []).filter((shot) =>
            (test.testId && shot.testId === test.testId) || shot.path.replace(/\W/g, '').toLowerCase().includes(titleKey))
            .map((shot) => relative(run.directory, shot.path).replace(/\\/g, '/'));
          appendFileSync(resolve(uiDirectory, 'results.jsonl'), redact(JSON.stringify({ name,
            status: ({ passed: 'Pass', failed: 'Fail', pending: 'Not Run', skipped: 'Not Run' })[test.state] || 'Not Run',
            durationMs: test.attempts?.reduce((sum, attempt) => sum + (attempt.wallClockDuration || 0), 0) || 0,
            error: last?.displayError || last?.error?.message || test.displayError || null,
            observations: observed.get(name) || [], screenshots })) + '\n');
        }
      });
      on('after:run', async (results) => {
        try {
          await afterRunHook(results);
          const jsonDirectory = resolve(uiDirectory, 'report/.jsons');
          const reports = readdirSync(jsonDirectory).filter((name) => name.endsWith('.json'))
            .map((name) => JSON.parse(readFileSync(resolve(jsonDirectory, name), 'utf8')));
          const resultFile = resolve(uiDirectory, 'results.jsonl');
          const rows = readFileSync(resultFile, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
          writeFileSync(resultFile, mergeCypressResults(rows, reports).map((row) => redact(JSON.stringify(row))).join('\n') + '\n');
        }
        finally {
          await fixtures.cleanupAll();
          writeFileSync(resolve(uiDirectory, 'suite.json'), JSON.stringify({ suite: 'ui',
            runId: run.manifest.runId, exitCode: results.totalFailed ? 1 : 0,
            counts: { tests: results.totalTests, pass: results.totalPassed, fail: results.totalFailed,
              pending: results.totalPending, skipped: results.totalSkipped } }, null, 2) + '\n');
        }
      });
      return config;
    }
  },
  env: {
    ADMIN_USER: process.env.ADMIN_USER || '',
    ADMIN_PASS: process.env.ADMIN_PASS || '',
    DOCTOR_USER: process.env.DOCTOR_USER || '',
    DOCTOR_PASS: process.env.DOCTOR_PASS || '',
    RECEPTION_USER: process.env.RECEPTION_USER || '',
    RECEPTION_PASS: process.env.RECEPTION_PASS || '',
    API_URL: process.env.API_URL || 'http://localhost:5000/api'
  }
});
