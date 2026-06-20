const { test, expect } = require('./fixtures');

test.describe('deepDiff Function', () => {
    test('identifies identical and changed primitives', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { deepDiff } = await import('./js/state.js');
            const identical = deepDiff(1, 1);
            const changed = deepDiff('a', 'b');
            return { identical, changed };
        });
        expect(result.identical.length).toBe(0);
        expect(result.changed.length).toBe(1);
        expect(result.changed[0]).toEqual({ path: [], type: 'modify', value: 'b', oldValue: 'a' });
    });

    test('handles nulls correctly', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { deepDiff } = await import('./js/state.js');
            const nullToObj = deepDiff(null, { a: 1 });
            const objToNull = deepDiff({ a: 1 }, null);
            const bothNull = deepDiff(null, null);
            return { nullToObj, objToNull, bothNull };
        });
        expect(result.nullToObj.length).toBe(1);
        expect(result.nullToObj[0]).toEqual({ path: [], type: 'modify', value: { a: 1 }, oldValue: null });
        expect(result.objToNull.length).toBe(1);
        expect(result.objToNull[0]).toEqual({ path: [], type: 'modify', value: null, oldValue: { a: 1 } });
        expect(result.bothNull.length).toBe(0);
    });

    test('detects added object keys', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { deepDiff } = await import('./js/state.js');
            return deepDiff({ a: 1 }, { a: 1, b: 2 });
        });
        expect(result.length).toBe(1);
        expect(result[0]).toEqual({ path: ['b'], type: 'add', value: 2 });
    });

    test('detects removed object keys', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { deepDiff } = await import('./js/state.js');
            return deepDiff({ a: 1, b: 2 }, { a: 1 });
        });
        expect(result.length).toBe(1);
        expect(result[0]).toEqual({ path: ['b'], type: 'remove', oldValue: 2 });
    });

    test('detects modified nested object keys', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { deepDiff } = await import('./js/state.js');
            const oldObj = { a: { b: { c: 1 } } };
            const newObj = { a: { b: { c: 2 } } };
            return deepDiff(oldObj, newObj);
        });
        expect(result.length).toBe(1);
        expect(result[0]).toEqual({ path: ['a', 'b', 'c'], type: 'modify', value: 2, oldValue: 1 });
    });

    test('handles arrays correctly by treating differing arrays as replaced', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { deepDiff } = await import('./js/state.js');
            const sameArray = deepDiff([1, 2], [1, 2]);
            const diffArray = deepDiff([1, 2], [1, 2, 3]);
            const arrToObj = deepDiff([1], { a: 1 });
            const objToArr = deepDiff({ a: 1 }, [1]);
            const objWithArrOld = deepDiff({ a: [1] }, { a: 1 });
            const objWithArrNew = deepDiff({ a: 1 }, { a: [1] });
            const nestedArrChange = deepDiff({ a: [1] }, { a: [1, 2] });
            return { sameArray, diffArray, arrToObj, objToArr, objWithArrOld, objWithArrNew, nestedArrChange };
        });
        expect(result.sameArray.length).toBe(0);
        expect(result.diffArray.length).toBe(1);
        expect(result.diffArray[0]).toEqual({ path: [], type: 'modify', value: [1, 2, 3], oldValue: [1, 2] });

        // arrToObj comparison
        expect(result.arrToObj.length).toBe(2);
        // Array has index '0', obj doesn't have it (so remove '0')
        // Obj has 'a', array doesn't have it (so add 'a')
        const removed0 = result.arrToObj.find(c => c.path.join('.') === '0' && c.type === 'remove');
        const addedA = result.arrToObj.find(c => c.path.join('.') === 'a' && c.type === 'add');
        expect(removed0).toBeTruthy();
        expect(addedA).toBeTruthy();

        expect(result.objWithArrOld.length).toBe(1);
        expect(result.objWithArrOld[0]).toEqual({ path: ['a'], type: 'modify', value: 1, oldValue: [1] });

        expect(result.objWithArrNew.length).toBe(1);
        expect(result.objWithArrNew[0]).toEqual({ path: ['a'], type: 'modify', value: [1], oldValue: 1 });

        expect(result.nestedArrChange.length).toBe(1);
        expect(result.nestedArrChange[0]).toEqual({ path: ['a'], type: 'modify', value: [1, 2], oldValue: [1] });
    });
});
