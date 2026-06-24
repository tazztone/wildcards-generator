// @ts-check
const { test, expect } = require('./fixtures');

test.describe('crypto module', () => {

    test('encrypt returns null for falsy data', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { encrypt } = await import('./js/crypto.js');
            return {
                nullData: await encrypt(null),
                emptyString: await encrypt(''),
                undefinedData: await encrypt(undefined)
            };
        });

        expect(result.nullData).toBeNull();
        expect(result.emptyString).toBeNull();
        expect(result.undefinedData).toBeNull();
    });

    test('decrypt returns null for falsy data', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { decrypt } = await import('./js/crypto.js');
            return {
                nullData: await decrypt(null),
                undefinedData: await decrypt(undefined)
            };
        });

        expect(result.nullData).toBeNull();
        expect(result.undefinedData).toBeNull();
    });

    test('encrypt and decrypt successfully process data', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { encrypt, decrypt } = await import('./js/crypto.js');

            const originalData = "sensitive API key 123";
            const encryptedResult = await encrypt(originalData);

            const isIvValid = encryptedResult.iv instanceof Uint8Array;
            const isEncryptedValid = encryptedResult.encrypted instanceof ArrayBuffer;

            const decryptedData = await decrypt(encryptedResult);

            return {
                originalData,
                decryptedData,
                isIvValid,
                isEncryptedValid
            };
        });

        expect(result.isIvValid).toBe(true);
        expect(result.isEncryptedValid).toBe(true);
        expect(result.decryptedData).toBe(result.originalData);
    });

    test('decrypt returns null on decryption failure', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { encrypt, decrypt } = await import('./js/crypto.js');

            const originalData = "test data";
            const encryptedResult = await encrypt(originalData);

            // Tamper with the initialization vector (IV) to simulate corruption or wrong key
            encryptedResult.iv[0] = encryptedResult.iv[0] ^ 1;

            const decryptedData = await decrypt(encryptedResult);

            return decryptedData;
        });

        expect(result).toBeNull();
    });
});
