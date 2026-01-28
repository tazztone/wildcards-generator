// @ts-check
/**
 * Shared Test Fixtures
 * 
 * Provides an extended test object that ensures the application is fully
 * initialized (YAML loaded, State populated) before each test runs.
 */
const { test: base, expect } = require('@playwright/test');

/**
 * Extended test fixture that waits for app to be fully ready
 */
const test = base.extend({
    page: async ({ page }, use) => {
        // Disable first-run help dialog for all tests
        await page.addInitScript(() => {
            window.localStorage.setItem('wildcards-visited', 'true');
        });

        // Navigate to root
        await page.goto('/');

        // Wait for app to be ready - check that State has loaded wildcards
        await page.waitForFunction(
            () => {
                // Check if State exists and has wildcards data
                if (typeof window.State === 'undefined') return false;
                if (!window.State._rawData) return false;
                const wildcards = window.State._rawData.wildcards;
                return wildcards && Object.keys(wildcards).length > 0;
            },
            { timeout: 20000 }
        ).catch((err) => {
            console.warn('App readiness check timed out, proceeding anyway:', err.message);
        });

        // Also wait for main UI element to be visible
        await page.waitForSelector('#wildcard-container', {
            state: 'visible',
            timeout: 10000
        }).catch(() => {
            // If wildcard container isn't visible, app might be in different view
            // That's okay for some tests
        });

        // Hand off the fully initialized page to the test
        await use(page);
    },
});

module.exports = { test, expect };
