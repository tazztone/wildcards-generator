// @ts-check
const { test, expect } = require('./fixtures');

test.describe('saveConfig functionality', () => {

    test.beforeEach(async ({ page }) => {
        // Clear localStorage before each test
        await page.evaluate(() => {
            localStorage.clear();
        });
    });

    test('saves only modified values to localStorage', async ({ page }) => {
        const result = await page.evaluate(async () => {
            window.Config.CONFIG_STORAGE_KEY = "wildcardGeneratorConfig_v1";
            window.Config.API_ENDPOINT = "openrouter"; // default
            window.Config.MODEL_TEMPERATURE = 0.9;     // modified from 0.7
            window.Config.PREFERRED_VIEW = "mindmap";  // modified from "list"

            await window.saveConfig();

            const savedString = localStorage.getItem("wildcardGeneratorConfig_v1");
            const savedData = savedString ? JSON.parse(savedString) : {};

            return {
                savedString,
                savedData
            };
        });

        // The default values shouldn't be saved
        expect(result.savedData.API_ENDPOINT).toBeUndefined();
        // The modified values should be saved
        expect(result.savedData.MODEL_TEMPERATURE).toBe(0.9);
        expect(result.savedData.PREFERRED_VIEW).toBe('mindmap');
    });

    test('ignores runtime keys starting with API_KEY', async ({ page }) => {
        const result = await page.evaluate(async () => {
            window.Config.CONFIG_STORAGE_KEY = "wildcardGeneratorConfig_v1";
            window.Config.API_KEY_OPENROUTER = "secret123";
            window.Config.API_KEY_GEMINI = "secret456";
            window.Config.MODEL_TEMPERATURE = 0.9; // just to have something saved

            await window.saveConfig();

            const savedString = localStorage.getItem("wildcardGeneratorConfig_v1");
            const savedData = savedString ? JSON.parse(savedString) : {};

            return savedData;
        });

        expect(result.API_KEY_OPENROUTER).toBeUndefined();
        expect(result.API_KEY_GEMINI).toBeUndefined();
        expect(result.MODEL_TEMPERATURE).toBe(0.9);
    });

    test('throttles toast notifications', async ({ page }) => {
        const result = await page.evaluate(async () => {
            let toastCallCount = 0;
            // Overwrite UI.showToast rather than replacing the window.UI object
            // because config.js imports { UI } directly
            const originalShowToast = window.UI.showToast;

            window.UI.showToast = (msg, type) => {
                toastCallCount++;
            };

            window.Config.CONFIG_STORAGE_KEY = "wildcardGeneratorConfig_v1";
            window.Config.MODEL_TEMPERATURE = 0.5;

            // Wait a little bit to clear the time if the previous tests affected lastSaveToastTime inside the closure
            await new Promise(r => setTimeout(r, 1100));

            // First call, should trigger toast
            await window.saveConfig();

            // Fast subsequent calls (time not advanced enough), should be throttled
            await window.saveConfig();
            await window.saveConfig();

            // After 1 second passes, should trigger toast again
            await new Promise(r => setTimeout(r, 1100));
            await window.saveConfig();

            // Restore
            window.UI.showToast = originalShowToast;

            return toastCallCount;
        });

        // 1 initial + 1 after waiting > 1000ms = 2
        expect(result).toBe(2);
    });
});
