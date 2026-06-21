const { test, expect } = require('./fixtures');

test.describe('TemplateEngine Logic', () => {
    test.beforeEach(async ({ page }) => {
        // Set up base state with roles
        await page.evaluate(() => {
            window.State.state.wildcards = {
                'Characters': {
                    instruction: '',
                    _id: 'node-char',
                    'Knights': { instruction: '', wildcards: ['Knight1', 'Knight2'], _id: 'node-knight' }
                },
                'Locations': {
                    instruction: '',
                    _id: 'node-loc',
                    'Castles': { instruction: '', wildcards: ['Castle1'], _id: 'node-castle' }
                },
                'Styles': {
                    instruction: '',
                    _id: 'node-style',
                    'Anime': { instruction: '', wildcards: ['Anime1'], _id: 'node-anime' }
                }
            };
            window.State.categoryTags = {
                'node-knight': { role: 'Subject', type: 'General' },
                'node-castle': { role: 'Location', type: 'General' },
                'node-anime': { role: 'Style', type: 'General' }
            };
        });
    });

    test('getPatterns returns available patterns', async ({ page }) => {
        const patterns = await page.evaluate(async () => {
            const { TemplateEngine } = await import('./js/template-engine.js');
            return TemplateEngine.getPatterns();
        });

        expect(Array.isArray(patterns)).toBe(true);
        expect(patterns.length).toBeGreaterThan(0);
        expect(patterns[0]).toHaveProperty('id');
        expect(patterns[0]).toHaveProperty('pattern');
        expect(patterns[0]).toHaveProperty('requiredRoles');
        expect(patterns[0]).toHaveProperty('weight');
    });

    test('checkReadiness works with available roles', async ({ page }) => {
        const readiness = await page.evaluate(async () => {
            const { TemplateEngine } = await import('./js/template-engine.js');
            return TemplateEngine.checkReadiness();
        });

        expect(readiness.canGenerate).toBe(true);
        expect(readiness.availableRoles).toEqual(expect.arrayContaining(['Subject', 'Location', 'Style']));
        expect(readiness.missingRoles).toEqual(['Modifier']);
    });

    test('generate works with strict mode', async ({ page }) => {
        const results = await page.evaluate(async () => {
            const { TemplateEngine } = await import('./js/template-engine.js');
            return TemplateEngine.generate(10, 'strict');
        });

        expect(results.length).toBeGreaterThan(0);
        // All results should contain exact paths labels, e.g. Knights, Castles or Anime
        for (const res of results) {
            expect(res).toMatch(/(Knights|Castles|Anime)/);
            // Strict mode should not have wildcard formatting
            expect(res).not.toMatch(/~~/);
        }
    });

    test('generate works with wildcard mode', async ({ page }) => {
        const results = await page.evaluate(async () => {
            const { TemplateEngine } = await import('./js/template-engine.js');
            return TemplateEngine.generate(10, 'wildcard');
        });

        expect(results.length).toBeGreaterThan(0);
        // All results should contain wildcards formatting
        for (const res of results) {
            expect(res).toMatch(/~~/);
        }
    });

    test('generate applies filterPaths option correctly', async ({ page }) => {
        const results = await page.evaluate(async () => {
            const { TemplateEngine } = await import('./js/template-engine.js');
            // Only allow characters
            return TemplateEngine.generate(5, 'wildcard', { filterPaths: ['Characters/Knights'] });
        });

        expect(results.length).toBeGreaterThan(0);
        for (const res of results) {
            // Should contain Knights wildcard but not Locations or Styles
            expect(res).toMatch(/~~Characters\/Knights~~/);
            expect(res).not.toMatch(/~~Locations\/Castles~~/);
            expect(res).not.toMatch(/~~Styles\/Anime~~/);
        }
    });

    test('generate warns and returns empty when no roles available', async ({ page }) => {
        const results = await page.evaluate(async () => {
            // Clear roles
            window.State.categoryTags = {};
            const { TemplateEngine } = await import('./js/template-engine.js');

            // Intercept console.warn
            const originalWarn = console.warn;
            let warnCalled = false;
            console.warn = () => { warnCalled = true; };

            const res = TemplateEngine.generate(5);

            console.warn = originalWarn;
            return { res, warnCalled };
        });

        expect(results.res).toEqual([]);
        expect(results.warnCalled).toBe(true);
    });
});
