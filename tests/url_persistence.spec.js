import { test, expect } from '@playwright/test';

test.describe('Setting Persistence Tests', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForFunction(() => typeof window.UI !== 'undefined');
    });

    test('should persist Custom API URL when changed', async ({ page }) => {
        // 0. Open Settings
        await page.click('#settings-btn');
        await page.waitForSelector('#settings-dialog', { state: 'visible' });

        // 1. Select Custom Endpoint
        await page.selectOption('#api-endpoint', 'custom');

        // 2. Change the URL
        const newUrl = 'http://test-server:5000/v1';
        await page.fill('#custom-api-url', newUrl);
        // Trigger change event just in case fill doesn't (it usually does input, but we listen for change)
        await page.dispatchEvent('#custom-api-url', 'change');

        // 3. Reload page to simulate new session
        await page.reload();
        await page.waitForFunction(() => typeof window.UI !== 'undefined');

        // 4. Check if value is restored
        // Open Settings again
        await page.click('#settings-btn');
        await page.waitForSelector('#settings-dialog', { state: 'visible' });

        // First ensure custom is selected (endpoint selection is also persisted)
        await page.selectOption('#api-endpoint', 'custom');

        const inputValue = await page.inputValue('#custom-api-url');
        expect(inputValue).toBe(newUrl);

        // 5. Check localStorage directly
        const storedConfig = await page.evaluate(() => localStorage.getItem('wildcardGeneratorConfig_v1'));
        if (!storedConfig) throw new Error('Config not saved');
        const config = JSON.parse(storedConfig);
        expect(config.API_URL_CUSTOM).toBe(newUrl);
    });

});
