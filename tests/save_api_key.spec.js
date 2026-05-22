// @ts-check
const { test, expect } = require('./fixtures');

test.describe('saveApiKey function', () => {

    test('updates Config and validates correct key format', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { saveApiKey, Config } = await import('./js/config.js');

            const validation = await saveApiKey('openrouter', 'sk-or-validkey123', false);

            return {
                validation,
                configValue: Config['OPENROUTER_API_KEY']
            };
        });

        expect(result.validation.isValid).toBe(true);
        expect(result.validation.error).toBeNull();
        expect(result.configValue).toBe('sk-or-validkey123');
    });

    test('validates incorrect key format but still updates Config', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { saveApiKey, Config } = await import('./js/config.js');

            const validation = await saveApiKey('gemini', 'wrong-format-key', false);

            return {
                validation,
                configValue: Config['GEMINI_API_KEY']
            };
        });

        expect(result.validation.isValid).toBe(false);
        expect(result.validation.error).toBe('Gemini keys typically start with "AIzaSy"');
        expect(result.configValue).toBe('wrong-format-key');
    });

    test('persists key to localStorage when persist is true', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { saveApiKey } = await import('./js/config.js');

            await saveApiKey('groq', 'gsk_validkey123', true);

            const storedValue = localStorage.getItem('wildcards_api_key_groq');
            let parsed = null;
            if (storedValue) {
                parsed = JSON.parse(storedValue);
            }

            return {
                storedValueExists: !!storedValue,
                hasIv: parsed ? !!parsed.iv : false,
                hasEncrypted: parsed ? !!parsed.encrypted : false
            };
        });

        expect(result.storedValueExists).toBe(true);
        expect(result.hasIv).toBe(true);
        expect(result.hasEncrypted).toBe(true);
    });

    test('removes key from localStorage when persist is false', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { saveApiKey } = await import('./js/config.js');

            // First save it
            await saveApiKey('custom', 'my-custom-key', true);
            const savedValue = localStorage.getItem('wildcards_api_key_custom');

            // Then remove it
            await saveApiKey('custom', 'my-custom-key', false);
            const removedValue = localStorage.getItem('wildcards_api_key_custom');

            return {
                savedValueExists: !!savedValue,
                removedValueExists: !!removedValue
            };
        });

        expect(result.savedValueExists).toBe(true);
        expect(result.removedValueExists).toBe(false);
    });

    test('handles empty keys by validating as true and storing empty', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { saveApiKey, Config } = await import('./js/config.js');

            const validation = await saveApiKey('openrouter', '', true);
            const storedValue = localStorage.getItem('wildcards_api_key_openrouter');


            return {
                validation,
                configValue: Config['OPENROUTER_API_KEY'],
            };
        });

        expect(result.validation.isValid).toBe(true);
        expect(result.configValue).toBe('');
    });
});
