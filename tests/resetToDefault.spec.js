const { test, expect } = require('./fixtures');

test.describe('Config resetToDefault', () => {
    test('resets valid keys to null or default values', async ({ page }) => {
        const result = await page.evaluate(async () => {
            // Setup initial non-default values
            window.Config.CUSTOM_SYSTEM_PROMPT = 'custom system prompt';
            window.Config.CUSTOM_SUGGEST_PROMPT = 'custom suggest prompt';
            window.Config.CUSTOM_TEMPLATE_PROMPT = 'custom template prompt';
            window.Config.API_ENDPOINT = 'custom_endpoint';

            // Reset keys
            window.resetToDefault('CUSTOM_SYSTEM_PROMPT');
            const systemPromptAfter = window.Config.CUSTOM_SYSTEM_PROMPT;

            window.resetToDefault('CUSTOM_SUGGEST_PROMPT');
            const suggestPromptAfter = window.Config.CUSTOM_SUGGEST_PROMPT;

            window.resetToDefault('CUSTOM_TEMPLATE_PROMPT');
            const templatePromptAfter = window.Config.CUSTOM_TEMPLATE_PROMPT;

            window.resetToDefault('API_ENDPOINT');
            const apiEndpointAfter = window.Config.API_ENDPOINT;

            return {
                systemPromptAfter,
                suggestPromptAfter,
                templatePromptAfter,
                apiEndpointAfter
            };
        });

        expect(result.systemPromptAfter).toBe(null);
        expect(result.suggestPromptAfter).toBe(null);
        expect(result.templatePromptAfter).toBe(null);
        expect(result.apiEndpointAfter).toBe('openrouter');
    });

    test('calls saveConfig and updates localStorage for valid keys', async ({ page }) => {
        const result = await page.evaluate(async () => {
            // Mock localStorage.setItem to track if it's called
            let setItemCalled = false;
            let savedKey = '';
            let savedValue = '';
            const originalSetItem = localStorage.setItem;

            localStorage.setItem = (key, value) => {
                setItemCalled = true;
                savedKey = key;
                savedValue = value;
            };

            // Setup a non-default value to ensure saveConfig detects a change
            window.Config.CUSTOM_SYSTEM_PROMPT = 'temporary custom prompt';

            try {
                // Call reset
                window.resetToDefault('CUSTOM_SYSTEM_PROMPT');
            } finally {
                // Restore mock
                localStorage.setItem = originalSetItem;
            }

            return {
                setItemCalled,
                savedKey,
                savedValueIsString: typeof savedValue === 'string',
                savedValueContainsNull: savedValue.includes('null') || !savedValue.includes('temporary custom prompt')
            };
        });

        expect(result.setItemCalled).toBe(true);
        expect(result.savedKey).toBe('wildcardGeneratorConfig_v1'); // Default CONFIG_STORAGE_KEY
        expect(result.savedValueIsString).toBe(true);
        // It shouldn't contain the custom prompt anymore because it was reset to null
        expect(result.savedValueContainsNull).toBe(true);
    });

    test('does nothing for unknown keys', async ({ page }) => {
        const result = await page.evaluate(async () => {
            // Setup initial non-default values
            window.Config.UNKNOWN_KEY = 'custom value';

            // Reset unknown key
            window.resetToDefault('UNKNOWN_KEY');

            return {
                unknownKeyAfter: window.Config.UNKNOWN_KEY
            };
        });

        expect(result.unknownKeyAfter).toBe('custom value');
    });

    test('handles edge cases gracefully without throwing errors', async ({ page }) => {
        const result = await page.evaluate(() => {
            let errorCaught = false;
            try {
                window.resetToDefault(undefined);
                window.resetToDefault(null);
                window.resetToDefault('');
                window.resetToDefault(123);
                window.resetToDefault({});
                window.resetToDefault([]);
                window.resetToDefault(true);
            } catch (e) {
                errorCaught = true;
            }
            return errorCaught;
        });

        expect(result).toBe(false);
    });

    test('does not call saveConfig for invalid or edge case keys', async ({ page }) => {
        const result = await page.evaluate(() => {
            let saveCount = 0;
            const originalSetItem = localStorage.setItem;

            localStorage.setItem = (key, value) => {
                if (key === window.Config.CONFIG_STORAGE_KEY) {
                    saveCount++;
                }
            };

            try {
                window.resetToDefault(undefined);
                window.resetToDefault(null);
                window.resetToDefault('');
                window.resetToDefault(123);
                window.resetToDefault({});
                window.resetToDefault([]);
                window.resetToDefault(true);
                window.resetToDefault('NON_EXISTENT_KEY');
            } finally {
                localStorage.setItem = originalSetItem;
            }

            return saveCount;
        });

        expect(result).toBe(0);
    });
});
