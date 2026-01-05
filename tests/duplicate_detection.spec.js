// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Unit tests for Duplicate Detection Logic
 * Tests the State.findDuplicates and State.cleanDuplicates functions
 */
test.describe('Duplicate Detection Logic', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        // Wait for App to be exposed and initialized
        await page.waitForFunction(() => window.App && window.State && window.State.state);
    });

    test('No duplicates returns empty result', async ({ page }) => {
        // Setup state with unique wildcards
        await page.evaluate(() => {
            window.State._rawData.wildcards = {
                Category1: { instruction: '', wildcards: ['apple', 'banana', 'cherry'] },
                Category2: { instruction: '', wildcards: ['dog', 'cat', 'bird'] }
            };
            window.State._initProxy();
        });

        // Check duplicates
        const result = await page.evaluate(() => {
            const res = window.State.findDuplicates();
            return {
                duplicates: res.duplicates,
                duplicateMapSize: res.duplicateMap.size
            };
        });

        expect(result.duplicates).toHaveLength(0);
        expect(result.duplicateMapSize).toBe(0);
        // Actually Playwright serializes Set as {} usually or array. Let's check duplicates array length mainly.
    });

    test('Detects exact duplicates within same category', async ({ page }) => {
        await page.evaluate(() => {
            window.State._rawData.wildcards = {
                Category1: { instruction: '', wildcards: ['apple', 'banana', 'apple'] }
            };
            window.State._initProxy();
        });

        const result = await page.evaluate(() => {
            const res = window.State.findDuplicates();
            return {
                duplicates: res.duplicates
            };
        });

        expect(result.duplicates.length).toBe(1);
        expect(result.duplicates[0].normalized).toBe('apple');
        expect(result.duplicates[0].count).toBe(2);
    });

    test('Case-insensitive duplicate matching', async ({ page }) => {
        await page.evaluate(() => {
            window.State._rawData.wildcards = {
                Category1: { instruction: '', wildcards: ['Apple', 'APPLE', 'apple'] }
            };
            window.State._initProxy();
        });

        const result = await page.evaluate(() => {
            const res = window.State.findDuplicates();
            return { duplicates: res.duplicates };
        });

        expect(result.duplicates.length).toBe(1);
        expect(result.duplicates[0].normalized).toBe('apple');
        expect(result.duplicates[0].count).toBe(3);
    });

    test('Detects duplicates across categories', async ({ page }) => {
        await page.evaluate(() => {
            window.State._rawData.wildcards = {
                Fruits: { instruction: '', wildcards: ['apple', 'banana'] },
                RedThings: { instruction: '', wildcards: ['apple', 'fire'] }
            };
            window.State._initProxy();
        });

        const result = await page.evaluate(() => {
            const res = window.State.findDuplicates();
            return { duplicates: res.duplicates };
        });

        expect(result.duplicates.length).toBe(1);
        expect(result.duplicates[0].normalized).toBe('apple');
        // Verify locations span two categories
        const locations = result.duplicates[0].locations;
        expect(locations.length).toBe(2);
        expect(locations.map(l => l.path)).toContain('Fruits');
        expect(locations.map(l => l.path)).toContain('RedThings');
    });

    test('Handles nested categories correctly', async ({ page }) => {
        await page.evaluate(() => {
            window.State._rawData.wildcards = {
                Parent: {
                    instruction: '',
                    Child1: { instruction: '', wildcards: ['shared', 'unique1'] },
                    Child2: { instruction: '', wildcards: ['shared', 'unique2'] }
                }
            };
            window.State._initProxy();
        });

        const result = await page.evaluate(() => {
            const res = window.State.findDuplicates();
            return { duplicates: res.duplicates };
        });

        expect(result.duplicates.length).toBe(1);
        expect(result.duplicates[0].normalized).toBe('shared');
        const locations = result.duplicates[0].locations;
        expect(locations.map(l => l.path)).toContain('Parent/Child1');
        expect(locations.map(l => l.path)).toContain('Parent/Child2');
    });

    test('Whitespace trimming in duplicate detection', async ({ page }) => {
        await page.evaluate(() => {
            window.State._rawData.wildcards = {
                Category1: { instruction: '', wildcards: ['  apple  ', 'apple', ' apple'] }
            };
            window.State._initProxy();
        });

        const result = await page.evaluate(() => {
            const res = window.State.findDuplicates();
            return { duplicates: res.duplicates };
        });

        expect(result.duplicates.length).toBe(1);
        expect(result.duplicates[0].count).toBe(3);
    });
});

test.describe('Duplicate Cleaning Logic', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await page.waitForFunction(() => window.App && window.State);
    });

    test('Clean Duplicates - Shortest Path Strategy', async ({ page }) => {
        await page.evaluate(() => {
            window.State._rawData.wildcards = {
                TopLevel: { wildcards: ['term'] },
                Nested: {
                    Deep: { wildcards: ['term'] }
                }
            };
            window.State._initProxy();
        });

        // Verify setup
        let duplicates = await page.evaluate(() => window.State.findDuplicates().duplicates);
        expect(duplicates.length).toBe(1);
        expect(duplicates[0].count).toBe(2);

        // Execute Clean
        const removedCount = await page.evaluate(() => {
            const dupes = window.State.findDuplicates().duplicates;
            return window.State.cleanDuplicates(dupes, 'shortest-path');
        });

        expect(removedCount).toBe(1);

        // Verify result: TopLevel should exist, Nested/Deep should be gone (or term removed from it)
        const resultingWildcards = await page.evaluate(() => window.State._rawData.wildcards);
        expect(resultingWildcards.TopLevel.wildcards).toContain('term');
        expect(resultingWildcards.Nested.Deep.wildcards).not.toContain('term');
    });

    test('Clean Duplicates - Longest Path Strategy', async ({ page }) => {
        await page.evaluate(() => {
            window.State._rawData.wildcards = {
                TopLevel: { wildcards: ['term'] },
                Nested: {
                    Deep: { wildcards: ['term'] }
                }
            };
            window.State._initProxy();
        });

        // Execute Clean
        const removedCount = await page.evaluate(() => {
            const dupes = window.State.findDuplicates().duplicates;
            return window.State.cleanDuplicates(dupes, 'longest-path');
        });

        expect(removedCount).toBe(1);

        // Verify result: Nested/Deep should exist, TopLevel should be gone
        const resultingWildcards = await page.evaluate(() => window.State._rawData.wildcards);
        expect(resultingWildcards.Nested.Deep.wildcards).toContain('term');
        expect(resultingWildcards.TopLevel.wildcards).not.toContain('term');
    });

    test('Clean Duplicates - Undo works', async ({ page }) => {
        await page.evaluate(() => {
            window.State._rawData.wildcards = {
                A: { wildcards: ['x'] },
                B: { wildcards: ['x'] }
            };
            window.State._initProxy();
            // Reset history but ensure we have a base state
            window.State.history = [JSON.stringify(window.State._rawData)];
            window.State.historyIndex = 0;
            // Save initial state logic usually happens on init or first change,
            // but let's force a save or just rely on cleanDuplicates saving current state before change.
        });

        await page.evaluate(() => {
            const dupes = window.State.findDuplicates().duplicates;
            window.State.cleanDuplicates(dupes, 'shortest-path');
        });

        // Check it's gone
        let result = await page.evaluate(() => window.State.findDuplicates());
        expect(result.duplicates.length).toBe(0);

        // Undo
        await page.evaluate(() => window.State.undo());

        // Check it's back
        result = await page.evaluate(() => window.State.findDuplicates());
        expect(result.duplicates.length).toBe(1);
    });

    test('Clean Duplicates - Same Category', async ({ page }) => {
        await page.evaluate(() => {
            window.State._rawData.wildcards = {
                "2 ACTION POSE AND EMOTION": {
                    "DYNAMIC ACTIONS": {
                        "Interaction": { wildcards: ['teaching', 'teaching'] }
                    }
                }
            };
            window.State._initProxy();
        });

        // Verify setup
        let duplicates = await page.evaluate(() => window.State.findDuplicates().duplicates);
        expect(duplicates.length).toBe(1);
        expect(duplicates[0].count).toBe(2);

        // Execute Clean
        const removedCount = await page.evaluate(() => {
            const dupes = window.State.findDuplicates().duplicates;
            return window.State.cleanDuplicates(dupes, 'shortest-path');
        });

        expect(removedCount).toBe(1);

        // Verify result
        const resultingWildcards = await page.evaluate(() => window.State._rawData.wildcards);
        expect(resultingWildcards["2 ACTION POSE AND EMOTION"]["DYNAMIC ACTIONS"]["Interaction"].wildcards).toHaveLength(1);
    });
});
