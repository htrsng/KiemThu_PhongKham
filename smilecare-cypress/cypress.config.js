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
      runMode: 2,
      openMode: 0
    },
    reporter: 'cypress-mochawesome-reporter',
    reporterOptions: {
      reportDir: 'cypress/reports',
      overwrite: false,
      html: true,
      json: true
    },
    setupNodeEvents(on, config) {
      require('cypress-mochawesome-reporter/plugin')(on);
      return config;
    }
  },
  env: {
    ADMIN_USER: process.env.ADMIN_USER || 'admin',
    ADMIN_PASS: process.env.ADMIN_PASS || 'Admin@123',
    LE_TAN_USER: process.env.LE_TAN_USER || 'letan01',
    LE_TAN_PASS: process.env.LE_TAN_PASS || 'Letan@123',
    BAC_SI_USER: process.env.BAC_SI_USER || 'bacsi01',
    BAC_SI_PASS: process.env.BAC_SI_PASS || 'Bacsi@123',
    THU_NGAN_USER: process.env.THU_NGAN_USER || 'thungan',
    THU_NGAN_PASS: process.env.THU_NGAN_PASS || 'Thungan@123',
    API_URL: process.env.API_URL || 'http://localhost:3000/api'
  }
});
