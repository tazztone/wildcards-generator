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

    test('deepClone handles primitive values correctly', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { deepClone } = await import('./js/utils.js');
            return {
                stringClone: deepClone('test'),
                numberClone: deepClone(42),
                booleanClone: deepClone(true),
                nullClone: deepClone(null),
                undefinedClone: deepClone(undefined)
            };
        });

        expect(result.stringClone).toBe('test');
        expect(result.numberClone).toBe(42);
        expect(result.booleanClone).toBe(true);
        expect(result.nullClone).toBe(null);
        expect(result.undefinedClone).toBe(undefined);
    });

    test('deepClone handles arrays and nested arrays', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { deepClone } = await import('./js/utils.js');
            const original = [1, [2, 3], { a: 4 }];
            const clone = deepClone(original);

            // Modify clone
            clone[1][0] = 99;
            clone[2].a = 100;

            return { original, clone };
        });

        expect(result.original).toEqual([1, [2, 3], { a: 4 }]);
        expect(result.clone).toEqual([1, [99, 3], { a: 100 }]);
    });

    test('deepClone uses JSON fallback when structuredClone is unavailable', async ({ page }) => {
        const result = await page.evaluate(async () => {
            // Backup structuredClone
            const originalStructuredClone = window.structuredClone;

            try {
                // Delete structuredClone from global object to force fallback
                // @ts-ignore
                delete window.structuredClone;

                const { deepClone } = await import('./js/utils.js');
                const original = { a: 1, b: { c: 2 }, d: [1, 2] };
                const clone = deepClone(original);

                // Modify clone
                clone.b.c = 3;
                clone.d.push(3);

                return {
                    original,
                    clone,
                    isStructuredCloneMissing: typeof window.structuredClone === 'undefined'
                };
            } finally {
                // Restore structuredClone
                window.structuredClone = originalStructuredClone;
            }
        });

        expect(result.isStructuredCloneMissing).toBe(true);
        expect(result.original).toEqual({ a: 1, b: { c: 2 }, d: [1, 2] });
        expect(result.clone).toEqual({ a: 1, b: { c: 3 }, d: [1, 2, 3] });
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

    test('throttle function limits execution frequency', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { throttle } = await import('./js/utils.js');
            let counter = 0;
            const inc = throttle(() => counter++, 50);

            inc(); // Leading edge: immediate execution (counter: 1)
            inc(); // Throttled
            inc(); // Throttled

            const afterFirstCall = counter;

            // Wait a bit, but less than the 'wait' period (50ms)
            await new Promise(r => setTimeout(r, 20));
            inc(); // Still throttled, but updates latestArgs for trailing edge
            const midWay = counter;

            // Wait until after the throttle period (50ms total from start)
            // We've waited 20ms already, so 40ms more should be enough.
            await new Promise(r => setTimeout(r, 60));
            const afterThrottle = counter; // Should be 2 now due to trailing edge

            return { afterFirstCall, midWay, afterThrottle };
        });

        expect(result.afterFirstCall).toBe(1);
        expect(result.midWay).toBe(1);
        expect(result.afterThrottle).toBe(2);
    });
});
