// @ts-check
const { test, expect } = require('./fixtures');

test.describe('arrayBufferToBase64 function', () => {

    test('correctly converts ArrayBuffer to Base64 string', async ({ page }) => {
        const result = await page.evaluate(() => {
            const arrayBufferToBase64 = window.arrayBufferToBase64;

            // Test case 1: Hello World
            const text1 = "Hello World";
            const buffer1 = new TextEncoder().encode(text1).buffer;
            const base64_1 = arrayBufferToBase64(buffer1);
            const expected_1 = btoa(text1);

            // Test case 2: Empty buffer
            const buffer2 = new ArrayBuffer(0);
            const base64_2 = arrayBufferToBase64(buffer2);
            const expected_2 = "";

            // Test case 3: Binary data (0-255)
            const arr = new Uint8Array([0, 128, 255]);
            const buffer3 = arr.buffer;
            const base64_3 = arrayBufferToBase64(buffer3);
            const expected_3 = btoa(String.fromCharCode(0, 128, 255));

            return {
                test1: { actual: base64_1, expected: expected_1 },
                test2: { actual: base64_2, expected: expected_2 },
                test3: { actual: base64_3, expected: expected_3 }
            };
        });

        expect(result.test1.actual).toBe(result.test1.expected);
        expect(result.test2.actual).toBe(result.test2.expected);
        expect(result.test3.actual).toBe(result.test3.expected);
    });
});
