// @ts-check
const { test, expect } = require('./fixtures');

test.describe('loadConfig functionality', () => {

    test('loads default config when localStorage is empty', async ({ page }) => {
        const result = await page.evaluate(async () => {
            // Clear localStorage
            localStorage.clear();

            // Reset Config
            for (const key in window.Config) {
                delete window.Config[key];
            }

            await window.loadConfig();

            return {
                config: window.Config,
            };
        });

        expect(result.config).toBeDefined();
        expect(result.config.API_ENDPOINT).toBe('openrouter');
        expect(result.config.PREFERRED_VIEW).toBe('list');
        expect(result.config.MODEL_TEMPERATURE).toBe(0.7);
        // Verify a constant is present
        expect(result.config.CONFIG_STORAGE_KEY).toBe('wildcardGeneratorConfig_v1');
    });


    test('merges saved config with defaults correctly', async ({ page }) => {
        const result = await page.evaluate(async () => {
            // Setup saved config
            const savedConfig = {
                API_ENDPOINT: 'custom_endpoint',
                MODEL_TEMPERATURE: 0.9,
                UNKNOWN_KEY: 'should_be_kept'
            };
            localStorage.setItem('wildcardGeneratorConfig_v1', JSON.stringify(savedConfig));

            await window.loadConfig();

            return {
                config: window.Config,
            };
        });

        expect(result.config.API_ENDPOINT).toBe('custom_endpoint');
        expect(result.config.MODEL_TEMPERATURE).toBe(0.9);
        expect(result.config.UNKNOWN_KEY).toBe('should_be_kept');
        // Defaults should still exist
        expect(result.config.PREFERRED_VIEW).toBe('list');
    });

    test('migrates legacy keys correctly', async ({ page }) => {
        const result = await page.evaluate(async () => {
            // Setup saved config with old keys
            const savedConfig = {
                MINDMAP_CATEGORY_FONT_SIZE: 120,
                MINDMAP_NODE_FONT_SIZE: 80
            };
            localStorage.setItem('wildcardGeneratorConfig_v1', JSON.stringify(savedConfig));

            await window.loadConfig();

            return {
                config: window.Config,
            };
        });

        expect(result.config.MINDMAP_FONT_SIZE_CATEGORY).toBe(120);
        expect(result.config.MINDMAP_FONT_SIZE_LIST).toBe(80);
        // Ensure old keys are deleted
        expect(result.config.MINDMAP_CATEGORY_FONT_SIZE).toBeUndefined();
        expect(result.config.MINDMAP_NODE_FONT_SIZE).toBeUndefined();
    });

    test('falls back to constants on invalid JSON', async ({ page }) => {
        const result = await page.evaluate(async () => {
            // Setup invalid JSON
            localStorage.setItem('wildcardGeneratorConfig_v1', '{ invalid json ');

            // Mock console.error
            let consoleErrorCalled = false;
            let consoleErrorMessage = '';
            let consoleWarnCalled = false;
            let consoleWarnMessage = '';
            const originalConsoleError = console.error;
            const originalConsoleWarn = console.warn;
            console.error = (...args) => {
                consoleErrorCalled = true;
                consoleErrorMessage = args.join(' ');
            };
            console.warn = (...args) => {
                consoleWarnCalled = true;
                consoleWarnMessage = args.join(' ');
            };

            await window.loadConfig();

            // Restore mock
            console.error = originalConsoleError;
            console.warn = originalConsoleWarn;

            return {
                config: window.Config,
                consoleErrorCalled,
                consoleErrorMessage,
                consoleWarnCalled,
                consoleWarnMessage
            };
        });

        // The fallback uses Object.assign(Config, CONFIG_CONSTANTS);
        // It won't have userDefaults like PREFERRED_VIEW unless it was already there,
        // but it should definitely have the constants.
        expect(result.config.CONFIG_STORAGE_KEY).toBe('wildcardGeneratorConfig_v1');
        expect(result.consoleWarnCalled).toBe(true);
        expect(result.consoleWarnMessage).toContain('Failed to parse saved config, falling back to defaults:');
    });
});


    test('validates saved config against schema and falls back if corrupted', async ({ page }) => {
        const result = await page.evaluate(async () => {
            // Setup invalid config type (number instead of string for API_ENDPOINT)
            const savedConfig = {
                API_ENDPOINT: 12345
            };
            localStorage.setItem('wildcardGeneratorConfig_v1', JSON.stringify(savedConfig));

            // Mock console.warn
            let consoleWarnCalled = false;
            let consoleWarnMessage = '';
            const originalConsoleWarn = console.warn;
            console.warn = (...args) => {
                consoleWarnCalled = true;
                consoleWarnMessage = args.join(' ');
            };

            await window.loadConfig();

            // Restore mock
            console.warn = originalConsoleWarn;

            return {
                config: window.Config,
                consoleWarnCalled,
                consoleWarnMessage
            };
        });

        expect(result.consoleWarnCalled).toBe(true);
        expect(result.consoleWarnMessage).toContain('Config validation failed, falling back to defaults:');
        expect(result.config.API_ENDPOINT).toBe('openrouter'); // the default value
    });
