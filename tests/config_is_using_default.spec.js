// @ts-check
const { test, expect } = require('./fixtures');

test.describe('isUsingDefault functionality', () => {

    test('returns true for CUSTOM_SYSTEM_PROMPT when value is null', async ({ page }) => {
        const result = await page.evaluate(() => {
            window.Config.CUSTOM_SYSTEM_PROMPT = null;
            return window.isUsingDefault('CUSTOM_SYSTEM_PROMPT');
        });
        expect(result).toBe(true);
    });

    test('returns false for CUSTOM_SYSTEM_PROMPT when value is string', async ({ page }) => {
        const result = await page.evaluate(() => {
            window.Config.CUSTOM_SYSTEM_PROMPT = 'Custom system prompt value';
            return window.isUsingDefault('CUSTOM_SYSTEM_PROMPT');
        });
        expect(result).toBe(false);
    });

    test('returns true for CUSTOM_SUGGEST_PROMPT when value is null', async ({ page }) => {
        const result = await page.evaluate(() => {
            window.Config.CUSTOM_SUGGEST_PROMPT = null;
            return window.isUsingDefault('CUSTOM_SUGGEST_PROMPT');
        });
        expect(result).toBe(true);
    });

    test('returns false for CUSTOM_SUGGEST_PROMPT when value is string', async ({ page }) => {
        const result = await page.evaluate(() => {
            window.Config.CUSTOM_SUGGEST_PROMPT = 'Custom suggest prompt value';
            return window.isUsingDefault('CUSTOM_SUGGEST_PROMPT');
        });
        expect(result).toBe(false);
    });

    test('returns true for CUSTOM_TEMPLATE_PROMPT when value is null', async ({ page }) => {
        const result = await page.evaluate(() => {
            window.Config.CUSTOM_TEMPLATE_PROMPT = null;
            return window.isUsingDefault('CUSTOM_TEMPLATE_PROMPT');
        });
        expect(result).toBe(true);
    });

    test('returns false for CUSTOM_TEMPLATE_PROMPT when value is string', async ({ page }) => {
        const result = await page.evaluate(() => {
            window.Config.CUSTOM_TEMPLATE_PROMPT = 'Custom template prompt value';
            return window.isUsingDefault('CUSTOM_TEMPLATE_PROMPT');
        });
        expect(result).toBe(false);
    });

    test('returns true for API_ENDPOINT when value is openrouter', async ({ page }) => {
        const result = await page.evaluate(() => {
            window.Config.API_ENDPOINT = 'openrouter';
            return window.isUsingDefault('API_ENDPOINT');
        });
        expect(result).toBe(true);
    });

    test('returns false for API_ENDPOINT when value is not openrouter', async ({ page }) => {
        const result = await page.evaluate(() => {
            window.Config.API_ENDPOINT = 'gemini';
            return window.isUsingDefault('API_ENDPOINT');
        });
        expect(result).toBe(false);
    });

    test('returns false for unknown keys', async ({ page }) => {
        const result = await page.evaluate(() => {
            return window.isUsingDefault('UNKNOWN_KEY_THAT_DOES_NOT_EXIST');
        });
        expect(result).toBe(false);
    });
});
