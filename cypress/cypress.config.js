const {defineConfig} = require("cypress");

module.exports = defineConfig({
    chromeWebSecurity: false,
    viewportWidth: 1600,
    viewportHeight: 1200,
    reporter: "mochawesome",
    reporterOptions: {
        overwrite: false,
        html: false,
        json: true,
    },
    env: {
        apiUrl: "https://ws.opencb.org/opencga-test/webservices/rest/v2",
    },
    e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
        baseUrl: "http://localhost:3000/src/sites/iva/",
        setupNodeEvents(on, config) {
            // https://docs.cypress.io/guides/references/migration-guide#Plugins-File-Removed
            // plugin here!
            console.log(config);
            return config;
        },
    },
});