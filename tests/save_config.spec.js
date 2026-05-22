// @ts-check
const { test, expect } = require('./fixtures');

test.describe('saveConfig', () => {

    test('should save only changed configuration values to localStorage', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const saveConfig = window.saveConfig;
            const Config = window.Config;
            const UI = window.UI;

            // Mock UI.showToast
            let toastCalled = false;
            let toastMessage = '';
            let toastType = '';
            const originalShowToast = UI.showToast;
            UI.showToast = (msg, type) => {
                toastCalled = true;
                toastMessage = msg;
                toastType = type;
            };

            // Mock Date.now to ensure toast is triggered
            const originalDateNow = Date.now;
            Date.now = () => originalDateNow() + 5000; // Force it to be > 1000ms

            // Mock localStorage
            let savedData = null;
            let savedKey = null;
            const originalSetItem = localStorage.setItem;
            localStorage.setItem = (key, value) => {
                savedKey = key;
                savedData = JSON.parse(value);
            };

            // Setup Config
            Config.CONFIG_STORAGE_KEY = 'test_config_key';
            Config.HISTORY_LIMIT = 999; // Changed from default (50?)
            Config.PREFERRED_VIEW = 'mindmap'; // Changed from default ('list')
            Config.API_ENDPOINT = 'openrouter'; // Unchanged
            Config.GEMINI_API_KEY = 'should_not_save'; // Should be ignored

            try {
                await saveConfig();
            } finally {
                UI.showToast = originalShowToast;
                localStorage.setItem = originalSetItem;
                Date.now = originalDateNow;
            }

            return {
                savedKey,
                savedData,
                toastCalled,
                toastMessage,
                toastType
            };
        });

        expect(result.savedKey).toBe('test_config_key');
        expect(result.savedData).toBeDefined();
        // Check changed values are saved
        expect(result.savedData.HISTORY_LIMIT).toBe(999);
        expect(result.savedData.PREFERRED_VIEW).toBe('mindmap');
        // Check unchanged/ignored values are NOT saved
        expect(result.savedData.API_ENDPOINT).toBeUndefined();
        expect(result.savedData.GEMINI_API_KEY).toBeUndefined();

        // Check toast
        expect(result.toastCalled).toBe(true);
        expect(result.toastMessage).toBe('Configuration saved.');
        expect(result.toastType).toBe('success');
    });

    test('should not trigger toast if called within 1 second of previous save', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const saveConfig = window.saveConfig;
            const UI = window.UI;

            let toastCallCount = 0;
            const originalShowToast = UI.showToast;
            UI.showToast = () => {
                toastCallCount++;
            };

            // Mock localStorage
            const originalSetItem = localStorage.setItem;
            localStorage.setItem = () => {};

            // Mock Date.now to control time
            const originalDateNow = Date.now;
            let currentTime = originalDateNow() + 5000; // start 5 seconds in future
            Date.now = () => currentTime;

            try {
                await saveConfig(); // First call, should toast
                currentTime += 500; // Advance time by 500ms
                await saveConfig(); // Second call immediately after, should not toast
            } finally {
                UI.showToast = originalShowToast;
                localStorage.setItem = originalSetItem;
                Date.now = originalDateNow;
            }

            return { toastCallCount };
        });

        expect(result.toastCallCount).toBe(1);
    });
});
