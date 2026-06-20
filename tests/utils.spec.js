// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Utils Unit Tests', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    test('truncate limits string length and adds ellipsis', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { truncate } = await import('./js/utils.js');
            return {
                short: truncate('hello', 10),
                exact: truncate('hello world', 11),
                longEnd: truncate('hello world', 8),
                longStart: truncate('hello world', 8, 'start'),
                longMiddle: truncate('hello world', 8, 'middle'),
                tooShortForEllipsis: truncate('hello world', 2),
                notString: truncate(null, 5),
                middleEdge: truncate('hello', 4, 'middle')
            };
        });

        expect(result.short).toBe('hello');
        expect(result.exact).toBe('hello world');
        expect(result.longEnd).toBe('hello...');
        expect(result.longStart).toBe('...world');
        expect(result.longMiddle).toBe('hel...ld');
        expect(result.tooShortForEllipsis).toBe('he');
        expect(result.notString).toBe('');
        expect(result.middleEdge).toBe('h...');
    });

    test('deepClone creates an independent copy', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { deepClone } = await import('./js/utils.js');
            const original = { a: 1, b: { c: 2 } };
            const clone = deepClone(original);

            // Modify clone
            clone.b.c = 3;

            return { original, clone };
        });

        expect(result.original.b.c).toBe(2);
        expect(result.clone.b.c).toBe(3);
        expect(result.clone).toEqual({ a: 1, b: { c: 3 } });
    });

    test('sanitize function escapes HTML', async ({ page }) => {
        const result = await page.evaluate(async () => {
            // Import utils dynamically
            const { sanitize } = await import('./js/utils.js');
            return sanitize('<script>alert("xss")</script>');
        });

        expect(result).toBe('');
    });

    test('debounce function delays execution', async ({ page }) => {
        const result = await page.evaluate(async () => {
             const { debounce } = await import('./js/utils.js');
             let counter = 0;
             const inc = debounce(() => counter++, 50);

             inc();
             inc();
             inc();

             // Wait less than delay
             await new Promise(r => setTimeout(r, 10));
             const check1 = counter;

             // Wait more than delay
             await new Promise(r => setTimeout(r, 60));
             const check2 = counter;

             return { check1, check2 };
        });

        expect(result.check1).toBe(0);
        expect(result.check2).toBe(1);
    });
});
