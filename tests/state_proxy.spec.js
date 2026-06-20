const { test, expect } = require('./fixtures');

test.describe('State Proxy & YAML Logic', () => {

    test('should handle deep nested updates via proxy', async ({ page }) => {
        await page.evaluate(() => {
            window.State.state.wildcards = {
                'Deep': {
                    'Nested': {
                        'Item': { wildcards: [] }
                    }
                }
            };
        });

        // Trigger update
        await page.evaluate(() => {
            window.State.state.wildcards.Deep.Nested.Item.wildcards.push('test');
        });

        const result = await page.evaluate(() => window.State.state.wildcards.Deep.Nested.Item.wildcards[0]);
        expect(result).toBe('test');
    });

    test('should sort wildcards array automatically via proxy', async ({ page }) => {
        await page.evaluate(() => {
            window.State.state.wildcards = {
                'SortTest': { wildcards: ['b', 'a', 'c'] }
            };
        });

        // Proxy trap sorts on modification?
        // Wait, the trap in State.js sorts ONLY if modification happens.
        // Initial set of `wildcards` array via object replacement might not trigger sort of the array content if it was passed as whole.
        // But let's check if pushing triggers sort.

        await page.evaluate(() => {
            window.State.state.wildcards.SortTest.wildcards.push('d');
        });

        const result = await page.evaluate(() => window.State.state.wildcards.SortTest.wildcards);
        expect(result).toEqual(['a', 'b', 'c', 'd']);
    });

    test('processYamlNode should handle various comment formats for instructions', async ({ page }) => {
        // We test the internal function
        const result = await page.evaluate(async () => {
            // We need to use YAML library which is loaded in State.js
            // But processYamlNode expects a node from YAML.parseDocument
            // Since we can't easily import node_modules in page.evaluate without build step,
            // we stick to the CDN used by the app to ensure environment consistency.
            const yaml = (await import('https://cdn.jsdelivr.net/npm/yaml@2.8.2/browser/index.js')).default;

            const yamlText = `
Key1:
  # instruction: Do something
  - item1
Key2:
  # instruction: Another thing
  SubKey:
    - item2
             `;
            const doc = yaml.parseDocument(yamlText);
            return window.State.processYamlNode(doc.contents);
        });

        expect(result.Key1.instruction).toBe('Do something');
        expect(result.Key2.SubKey.instruction).toBe(''); // No instruction on SubKey, but parent had one?
        // Wait, instruction is on valueNode.
        // Key2 has comment. But Key2 is a map.
        // processYamlNode extracts instruction from pair.value comment.
        // So Key2 should have instruction.
        expect(result.Key2.instruction).toBe('Another thing');
    });

    test('processYamlNode should handle weird scalar values', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const yaml = (await import('https://cdn.jsdelivr.net/npm/yaml@2.8.2/browser/index.js')).default;
            const yamlText = `
NumberKey: 123
BoolKey: true
NullKey: null
             `;
            const doc = yaml.parseDocument(yamlText);
            return window.State.processYamlNode(doc.contents);
        });

        expect(result.NumberKey.wildcards[0]).toBe('123'); // Converted to string
        expect(result.BoolKey.wildcards[0]).toBe('true');
        expect(result.NullKey.wildcards[0]).toBe('null');
    });

});

    test.describe('createDeepProxy', () => {
        test('returns primitives untouched', async ({ page }) => {
            const result = await page.evaluate(async () => {
                const { createDeepProxy } = await import('./js/state.js');
                return {
                    num: createDeepProxy(1),
                    str: createDeepProxy("test"),
                    nil: createDeepProxy(null),
                    bool: createDeepProxy(true)
                };
            });
            expect(result.num).toBe(1);
            expect(result.str).toBe("test");
            expect(result.nil).toBe(null);
            expect(result.bool).toBe(true);
        });

        test('proxies nested objects and triggers onChange for deep sets', async ({ page }) => {
            const changes = await page.evaluate(async () => {
                const { createDeepProxy } = await import('./js/state.js');
                const target = { a: { b: { c: 1 } } };
                const changes = [];
                const proxy = createDeepProxy(target, [], (path, value, targetRef, type) => {
                    changes.push({ path, value, type: type || 'set' });
                });
                proxy.a.b.c = 2;
                return changes;
            });
            expect(changes.length).toBe(1);
            expect(changes[0].path).toEqual(['a', 'b', 'c']);
            expect(changes[0].value).toBe(2);
            expect(changes[0].type).toBe('set');
        });

        test('triggers onChange for property deletions', async ({ page }) => {
            const changes = await page.evaluate(async () => {
                const { createDeepProxy } = await import('./js/state.js');
                const target = { x: 10, y: 20 };
                const changes = [];
                const proxy = createDeepProxy(target, [], (path, value, targetRef, type) => {
                    changes.push({ path, value, type });
                });
                delete proxy.x;
                return changes;
            });
            expect(changes.length).toBe(1);
            expect(changes[0].path).toEqual(['x']);
            expect(changes[0].value).toBe(undefined);
            expect(changes[0].type).toBe('delete');
        });

        test('does not trigger onChange when setting to same value', async ({ page }) => {
            const changes = await page.evaluate(async () => {
                const { createDeepProxy } = await import('./js/state.js');
                const target = { a: 1 };
                const changes = [];
                const proxy = createDeepProxy(target, [], (path, value, targetRef, type) => {
                    changes.push({ path, value, type });
                });
                proxy.a = 1;
                return changes;
            });
            expect(changes.length).toBe(0);
        });
    });
