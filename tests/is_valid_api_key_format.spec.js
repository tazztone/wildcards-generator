// @ts-check
const { test, expect } = require('./fixtures');

test.describe('isValidApiKeyFormat function', () => {

    test('validates openrouter keys correctly', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const module = await import('./js/config.js');
            return {
                valid: module.isValidApiKeyFormat('openrouter', 'sk-or-12345'),
                invalid: module.isValidApiKeyFormat('openrouter', 'wrong-key')
            };
        });

        expect(result.valid.isValid).toBe(true);
        expect(result.valid.error).toBeNull();

        expect(result.invalid.isValid).toBe(false);
        expect(result.invalid.error).toBe('OpenRouter keys typically start with "sk-or-"');
    });

    test('validates gemini keys correctly', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const module = await import('./js/config.js');
            return {
                valid: module.isValidApiKeyFormat('gemini', 'AIzaSy12345'),
                invalid: module.isValidApiKeyFormat('gemini', 'wrong-key')
            };
        });

        expect(result.valid.isValid).toBe(true);
        expect(result.valid.error).toBeNull();

        expect(result.invalid.isValid).toBe(false);
        expect(result.invalid.error).toBe('Gemini keys typically start with "AIzaSy"');
    });

    test('validates groq keys correctly', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const module = await import('./js/config.js');
            return {
                valid: module.isValidApiKeyFormat('groq', 'gsk_12345'),
                invalid: module.isValidApiKeyFormat('groq', 'wrong-key')
            };
        });

        expect(result.valid.isValid).toBe(true);
        expect(result.valid.error).toBeNull();

        expect(result.invalid.isValid).toBe(false);
        expect(result.invalid.error).toBe('Groq keys typically start with "gsk_"');
    });

    test('is case-insensitive for provider name', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const module = await import('./js/config.js');
            return {
                upperOpenRouter: module.isValidApiKeyFormat('OPENROUTER', 'sk-or-123'),
                mixedGemini: module.isValidApiKeyFormat('GeMiNi', 'AIzaSy123')
            };
        });

        expect(result.upperOpenRouter.isValid).toBe(true);
        expect(result.mixedGemini.isValid).toBe(true);
    });

    test('trims whitespace before validation', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const module = await import('./js/config.js');
            return {
                paddedValid: module.isValidApiKeyFormat('openrouter', '  sk-or-12345  '),
                paddedInvalid: module.isValidApiKeyFormat('openrouter', '  wrong-key  ')
            };
        });

        expect(result.paddedValid.isValid).toBe(true);
        expect(result.paddedValid.error).toBeNull();

        expect(result.paddedInvalid.isValid).toBe(false);
        expect(result.paddedInvalid.error).not.toBeNull();
    });

    test('returns valid for unknown/custom providers', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const module = await import('./js/config.js');
            return module.isValidApiKeyFormat('custom-llm', 'any-format-key');
        });

        expect(result.isValid).toBe(true);
        expect(result.error).toBeNull();
    });

    test('handles empty, null, and undefined keys as valid (resetting)', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const module = await import('./js/config.js');
            return {
                emptyString: module.isValidApiKeyFormat('openrouter', ''),
                nullKey: module.isValidApiKeyFormat('gemini', null),
                undefinedKey: module.isValidApiKeyFormat('groq', undefined)
            };
        });

        expect(result.emptyString.isValid).toBe(true);
        expect(result.nullKey.isValid).toBe(true);
        expect(result.undefinedKey.isValid).toBe(true);
    });

    test('handles missing or non-string providers gracefully', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const module = await import('./js/config.js');
            return {
                undefinedProvider: module.isValidApiKeyFormat(undefined, 'sk-or-123'),
                nullProvider: module.isValidApiKeyFormat(null, 'sk-or-123'),
                numberProvider: module.isValidApiKeyFormat(123, 'sk-or-123'),
                objectProvider: module.isValidApiKeyFormat({}, 'sk-or-123')
            };
        });

        expect(result.undefinedProvider.isValid).toBe(true);
        expect(result.nullProvider.isValid).toBe(true);
        expect(result.numberProvider.isValid).toBe(true);
        expect(result.objectProvider.isValid).toBe(true);
    });


    test('handles non-string keys gracefully', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const module = await import('./js/config.js');
            return {
                numberKey: module.isValidApiKeyFormat('openrouter', 12345),
                objectKey: module.isValidApiKeyFormat('gemini', { key: 'AIzaSy12345' })
            };
        });

        expect(result.numberKey.isValid).toBe(false);
        expect(result.numberKey.error).toBe('Key must be a string');

        expect(result.objectKey.isValid).toBe(false);
        expect(result.objectKey.error).toBe('Key must be a string');
    });
});
