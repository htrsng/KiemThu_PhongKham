const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: process.env.BASE_URL || 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 8000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    video: true,
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    screenshotOnRunFailure: true,
    retries: {
      runMode: 0,
      openMode: 0
    },
    reporter: 'cypress-mochawesome-reporter',
    reporterOptions: {
      reportDir: 'cypress/reports',
      overwrite: false,
      removeJsonsFolderAfterMerge: false,
      html: true,
      json: true
    },
    setupNodeEvents(on, config) {
      const { beforeRunHook, afterRunHook } = require('cypress-mochawesome-reporter/lib');
      const fixtures = require('../helpers/qa-data');
      on('before:run', beforeRunHook);
      on('task', {
        'qa:create': fixtures.createFixture,
        'qa:cleanup': fixtures.cleanupAll,
      });
      on('after:run', async (results) => {
        try { await afterRunHook(results); }
        finally { await fixtures.cleanupAll(); }
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
