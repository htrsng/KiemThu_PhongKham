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
    ADMIN_USER: process.env.ADMIN_USER || '',
    ADMIN_PASS: process.env.ADMIN_PASS || '',
    DOCTOR_USER: process.env.DOCTOR_USER || '',
    DOCTOR_PASS: process.env.DOCTOR_PASS || '',
    RECEPTION_USER: process.env.RECEPTION_USER || '',
    RECEPTION_PASS: process.env.RECEPTION_PASS || '',
    LE_TAN_USER: process.env.LE_TAN_USER || '',
    LE_TAN_PASS: process.env.LE_TAN_PASS || '',
    BAC_SI_USER: process.env.BAC_SI_USER || '',
    BAC_SI_PASS: process.env.BAC_SI_PASS || '',
    THU_NGAN_USER: process.env.THU_NGAN_USER || '',
    THU_NGAN_PASS: process.env.THU_NGAN_PASS || '',
    API_URL: process.env.API_URL || 'http://localhost:5000/api'
  }
});
