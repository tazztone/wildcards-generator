const { test, expect } = require('./fixtures');

test.describe('generateNodeId', () => {
    test('generates unique string IDs of expected format', async ({ page }) => {
        const ids = await page.evaluate(async () => {
            const { generateNodeId } = await import('./js/state.js');
            const result = [];
            for (let i = 0; i < 1000; i++) {
                result.push(generateNodeId());
            }
            return result;
        });

        expect(ids.length).toBe(1000);

        // Check uniqueness
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBeGreaterThanOrEqual(950);

        // Check format (string and non-empty)
        for (const id of ids) {
            expect(typeof id).toBe('string');
            expect(id.length).toBeGreaterThan(0);
            expect(id.length).toBeLessThanOrEqual(15);
            // Verify alphanumeric format
            expect(/^[a-z0-9-]+$/i.test(id)).toBe(true);
        }
    });
});

test.describe('State Management Logic', () => {

    test('Deep proxy triggers updates on nested change', async ({ page }) => {
        await page.evaluate(async () => {
            // Setup a test path
            window.State.state.wildcards.TestCategory = { instruction: 'test', wildcards: ['item1'] };
        });

        const val = await page.evaluate(() => window.State.state.wildcards.TestCategory.wildcards[0]);
        expect(val).toBe('item1');

        await page.evaluate(() => {
            window.State.saveStateToHistory();
            window.State.state.wildcards.TestCategory.wildcards[0] = 'item2';
        });

        const newVal = await page.evaluate(() => window.State.state.wildcards.TestCategory.wildcards[0]);
        expect(newVal).toBe('item2');

        const historyLen = await page.evaluate(() => window.State.history.length);
        expect(historyLen).toBeGreaterThan(0);
    });

    test('History undo out of bounds is handled safely', async ({ page }) => {
        await page.evaluate(async () => {
            window.State._rawData.wildcards = {};
            window.State._initProxy();

            // Push base state first
            window.State.saveStateToHistory();

            // Step 1
            window.State.state.wildcards.UndoTest = { instruction: '', wildcards: ['step1'] };
            window.State.saveStateToHistory();

            // Step 2
            window.State.state.wildcards.UndoTest.wildcards[0] = 'step2';
            window.State.saveStateToHistory();
        });

        // Call undo multiple times, more than history size
        await page.evaluate(() => {
            for (let i = 0; i < 5; i++) {
                window.State.undo();
            }
        });

        const index = await page.evaluate(() => window.State.historyIndex);
        expect(index).toBe(0);

        // The very first history state we saved had empty wildcards
        const hasUndoTest = await page.evaluate(() => !!window.State.state.wildcards.UndoTest);
        expect(hasUndoTest).toBe(false);
    });

    test('Undo/Redo restores state correctly', async ({ page }) => {
        await page.evaluate(async () => {
            window.State._rawData.wildcards = {};
            window.State._initProxy();

            // Step 1
            window.State.state.wildcards.UndoTest = { instruction: '', wildcards: ['step1'] };
            window.State.saveStateToHistory();
        });

        // Step 2
        await page.evaluate(() => {
            window.State.state.wildcards.UndoTest.wildcards[0] = 'step2';
            window.State.saveStateToHistory();
        });

        let val = await page.evaluate(() => window.State.state.wildcards.UndoTest.wildcards[0]);
        expect(val).toBe('step2');

        await page.evaluate(() => window.State.undo());
        val = await page.evaluate(() => window.State.state.wildcards.UndoTest.wildcards[0]);
        expect(val).toBe('step1');

        await page.evaluate(() => window.State.redo());
        val = await page.evaluate(() => window.State.state.wildcards.UndoTest.wildcards[0]);
        expect(val).toBe('step2');
    });

    test('Deleting a property triggers update and is undoable', async ({ page }) => {
        // Increase timeout for this specific test
        test.setTimeout(60000);

        await page.evaluate(async () => {
            window.State._rawData.wildcards = {};
            window.State._initProxy();

            window.State.state.wildcards.DeleteTest = { instruction: '', wildcards: ['exist'] };
            window.State.saveStateToHistory();
        });

        // Delete
        await page.evaluate(() => {
            delete window.State.state.wildcards.DeleteTest;
            window.State.saveStateToHistory();
        });

        let exists = await page.evaluate(() => !!window.State.state.wildcards.DeleteTest);
        expect(exists).toBe(false);

        await page.evaluate(() => window.State.undo());
        exists = await page.evaluate(() => !!window.State.state.wildcards.DeleteTest);
        expect(exists).toBe(true);
    });

    test('Mixed operations (Add, Rename, Delete) with Undo/Redo', async ({ page }) => {
        test.setTimeout(60000);

        await page.evaluate(async () => {
            window.State._rawData.wildcards = {};
            window.State._initProxy();
            // Start
            window.State.saveStateToHistory();
        });

        // 1. Add Category
        await page.evaluate(() => {
            window.State.state.wildcards.Cat1 = { instruction: '', wildcards: [] };
            window.State.saveStateToHistory();
        });

        // 2. Add Item
        await page.evaluate(() => {
            window.State.state.wildcards.Cat1.wildcards.push('Item1');
            window.State.saveStateToHistory();
        });

        // 3. Rename Item (Update)
        await page.evaluate(() => {
            window.State.state.wildcards.Cat1.wildcards[0] = 'Item1_Renamed';
            window.State.saveStateToHistory();
        });

        // 4. Delete Category
        await page.evaluate(() => {
            delete window.State.state.wildcards.Cat1;
            window.State.saveStateToHistory();
        });

        // Check Delete
        let hasCat = await page.evaluate(() => !!window.State.state.wildcards.Cat1);
        expect(hasCat).toBe(false);

        // Undo Delete (Back to 3)
        await page.evaluate(() => window.State.undo());
        hasCat = await page.evaluate(() => !!window.State.state.wildcards.Cat1);
        expect(hasCat).toBe(true);
        let item = await page.evaluate(() => window.State.state.wildcards.Cat1.wildcards[0]);
        expect(item).toBe('Item1_Renamed');

        // Undo Rename (Back to 2)
        await page.evaluate(() => window.State.undo());
        item = await page.evaluate(() => window.State.state.wildcards.Cat1.wildcards[0]);
        expect(item).toBe('Item1');

        // Undo Add Item (Back to 1)
        await page.evaluate(() => window.State.undo());
        let wcLength = await page.evaluate(() => window.State.state.wildcards.Cat1.wildcards.length);
        expect(wcLength).toBe(0);

        // Undo Add Category (Back to Start)
        await page.evaluate(() => window.State.undo());
        hasCat = await page.evaluate(() => !!window.State.state.wildcards.Cat1);
        expect(hasCat).toBe(false);

        // Redo All
        await page.evaluate(() => window.State.redo()); // Add Cat
        expect(await page.evaluate(() => !!window.State.state.wildcards.Cat1)).toBe(true);

        await page.evaluate(() => window.State.redo()); // Add Item
        expect(await page.evaluate(() => window.State.state.wildcards.Cat1.wildcards.length)).toBe(1);

        await page.evaluate(() => window.State.redo()); // Rename
        expect(await page.evaluate(() => window.State.state.wildcards.Cat1.wildcards[0])).toBe('Item1_Renamed');

        await page.evaluate(() => window.State.redo()); // Delete
        expect(await page.evaluate(() => !!window.State.state.wildcards.Cat1)).toBe(false);
    });

    test('processYamlNode handles instructions in comments', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const yamlText = `
TestKey:
  # instruction: Do this
  - Item 1
`;
            // @ts-ignore
            const YAML = (await import('https://cdn.jsdelivr.net/npm/yaml@2.8.2/browser/index.js')).default;
            const doc = YAML.parseDocument(yamlText);

            return window.State.processYamlNode(doc.contents);
        });

        expect(result.TestKey.instruction).toBe('Do this');
        expect(result.TestKey.wildcards[0]).toBe('Item 1');
    });
});

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
            return { sameArray, diffArray, arrToObj, objToArr };
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
    });
});
