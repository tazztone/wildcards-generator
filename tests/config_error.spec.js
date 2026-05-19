// @ts-check
const { test, expect } = require('./fixtures');

test.describe('Config Error Handling', () => {

    test('saveConfig handles localStorage errors gracefully', async ({ page }) => {
        // Mock localStorage.setItem to throw error before calling saveConfig
        const result = await page.evaluate(async () => {
            // saveConfig is exposed on window via main.js in local environments
            const saveConfig = window.saveConfig;
            const UI = window.UI;

            // Mock console.error
            let consoleErrorCalled = false;
            let consoleErrorMessage = '';
            const originalConsoleError = console.error;
            console.error = (...args) => {
                consoleErrorCalled = true;
                consoleErrorMessage = args.join(' ');
                originalConsoleError(...args);
            };

            // Mock UI.showNotification
            let notificationCalled = false;
            let notificationMessage = '';
            const originalShowNotification = UI.showNotification;
            UI.showNotification = (msg) => {
                notificationCalled = true;
                notificationMessage = msg;
            };

            // Mock localStorage.setItem to throw
            const originalSetItem = localStorage.setItem;
            localStorage.setItem = () => {
                throw new Error('QuotaExceededError');
            };

            try {
                await saveConfig();
            } catch (e) {
                // saveConfig handles it but let's be safe
            } finally {
                // Restore mocks
                console.error = originalConsoleError;
                UI.showNotification = originalShowNotification;
                localStorage.setItem = originalSetItem;
            }

            return {
                consoleErrorCalled,
                consoleErrorMessage,
                notificationCalled,
                notificationMessage
            };
        });

        expect(result.consoleErrorCalled).toBe(true);
        expect(result.consoleErrorMessage).toContain('Failed to save config:');
        expect(result.consoleErrorMessage).toContain('QuotaExceededError');
        expect(result.notificationCalled).toBe(true);
        expect(result.notificationMessage).toContain('Error saving configuration: QuotaExceededError');
    });
});
