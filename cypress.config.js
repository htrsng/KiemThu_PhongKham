const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: 'http://localhost:3000', // Giả định domain của phòng khám
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false
  },
})
