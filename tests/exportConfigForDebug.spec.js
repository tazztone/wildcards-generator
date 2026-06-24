// @ts-check
const { test, expect } = require('./fixtures');

test.describe('exportConfigForDebug functionality', () => {

    test('returns valid JSON with expected structure', async ({ page }) => {
        const result = await page.evaluate(() => {
            const jsonString = window.exportConfigForDebug();
            return JSON.parse(jsonString);
        });

        expect(result).toHaveProperty('_comment');
        expect(result._comment).toBe('Wildcards Generator Debug Config');
        expect(result).toHaveProperty('timestamp');
        // Validate timestamp is a valid date
        expect(isNaN(Date.parse(result.timestamp))).toBe(false);
        expect(result).toHaveProperty('userAgent');
        expect(typeof result.userAgent).toBe('string');
        expect(result).toHaveProperty('configDiff');
        expect(typeof result.configDiff).toBe('object');
    });

    test('includes changed config values in configDiff', async ({ page }) => {
        const result = await page.evaluate(() => {
            // Modify a few configuration values to ensure they appear in configDiff
            window.Config.API_ENDPOINT = "custom_endpoint_for_test";
            window.Config.MODEL_TEMPERATURE = 0.88;

            const jsonString = window.exportConfigForDebug();
            return JSON.parse(jsonString).configDiff;
        });

        expect(result.API_ENDPOINT).toBe('custom_endpoint_for_test');
        expect(result.MODEL_TEMPERATURE).toBe(0.88);
        // Ensure defaults aren't included unless changed (e.g., if we didn't change PREFERRED_VIEW)
        expect(result.PREFERRED_VIEW).toBeUndefined();
    });

    test('filters out sensitive API keys', async ({ page }) => {
        const result = await page.evaluate(() => {
            // These would normally be runtime-only or hidden
            // `startsWith('API_KEY')` is caught by `getConfigDiff`,
            // but `includes('API_KEY')` is an extra safety layer in `exportConfigForDebug`.
            window.Config.API_KEY_TEST = "sensitive_key_1"; // filtered by getConfigDiff
            window.Config.MY_API_KEY_TEST = "sensitive_key_2"; // filtered by exportConfigForDebug
            window.Config.API_ENDPOINT = "another_endpoint";

            const jsonString = window.exportConfigForDebug();
            return JSON.parse(jsonString).configDiff;
        });

        expect(result.API_KEY_TEST).toBeUndefined();
        expect(result.MY_API_KEY_TEST).toBeUndefined();
        expect(result.API_ENDPOINT).toBe('another_endpoint');
    });
});
