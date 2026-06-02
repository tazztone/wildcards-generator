// @ts-check
const { test, expect } = require('./fixtures');

test.describe('updateConfigValue', () => {

    test('updates an existing string config key', async ({ page }) => {
        const result = await page.evaluate(() => {
            const originalEndpoint = window.Config.API_ENDPOINT;
            window.updateConfigValue('API_ENDPOINT', 'gemini');
            const newEndpoint = window.Config.API_ENDPOINT;
            return {
                original: originalEndpoint,
                updated: newEndpoint
            };
        });

        expect(result.updated).toBe('gemini');
        expect(result.updated).not.toBe(result.original);
    });

    test('updates an existing numeric config key', async ({ page }) => {
        const result = await page.evaluate(() => {
            const originalLimit = window.Config.HISTORY_LIMIT;
            window.updateConfigValue('HISTORY_LIMIT', '100'); // Pass string to ensure conversion
            const newLimit = window.Config.HISTORY_LIMIT;
            return {
                original: originalLimit,
                updated: newLimit,
                type: typeof newLimit
            };
        });

        expect(result.updated).toBe(100);
        expect(result.type).toBe('number');
    });

    test('ignores update if value is NaN (for numeric keys or in general)', async ({ page }) => {
        const result = await page.evaluate(() => {
            // Setup an initial value
            window.updateConfigValue('HISTORY_LIMIT', 50);
            const beforeLimit = window.Config.HISTORY_LIMIT;

            window.updateConfigValue('HISTORY_LIMIT', NaN);

            const afterLimit = window.Config.HISTORY_LIMIT;
            return {
                before: beforeLimit,
                after: afterLimit
            };
        });

        expect(result.after).toBe(50);
        expect(result.before).toBe(50);
    });

    test('ignores update if value is an invalid string for numeric keys', async ({ page }) => {
        const result = await page.evaluate(() => {
            // Setup an initial value
            window.updateConfigValue('HISTORY_LIMIT', 50);
            const beforeLimit = window.Config.HISTORY_LIMIT;

            window.updateConfigValue('HISTORY_LIMIT', 'abc');

            const afterLimit = window.Config.HISTORY_LIMIT;
            return {
                before: beforeLimit,
                after: afterLimit
            };
        });

        expect(result.after).toBe(50);
        expect(result.before).toBe(50);
    });

    test('ignores update if value is empty or whitespace-only string', async ({ page }) => {
        const result = await page.evaluate(() => {
            window.updateConfigValue('API_ENDPOINT', 'openrouter');
            const beforeEndpoint = window.Config.API_ENDPOINT;

            window.updateConfigValue('API_ENDPOINT', '   ');

            const afterEndpoint = window.Config.API_ENDPOINT;
            return {
                before: beforeEndpoint,
                after: afterEndpoint
            };
        });

        expect(result.after).toBe('openrouter');
        expect(result.before).toBe('openrouter');
    });

    test('does not add new properties if the key does not exist', async ({ page }) => {
        const result = await page.evaluate(() => {
            const hasKeyBefore = window.Config.hasOwnProperty('NON_EXISTENT_KEY');
            window.updateConfigValue('NON_EXISTENT_KEY', 'some_value');
            const hasKeyAfter = window.Config.hasOwnProperty('NON_EXISTENT_KEY');

            return {
                hasKeyBefore,
                hasKeyAfter
            };
        });

        expect(result.hasKeyBefore).toBe(false);
        expect(result.hasKeyAfter).toBe(false);
    });

});
