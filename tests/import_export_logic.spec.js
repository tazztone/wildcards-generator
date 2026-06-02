// @ts-check
const { test, expect } = require('./fixtures');

test.describe('ImportExport._buildExportYaml Unit Tests', () => {

    test('basic serialization with wildcards only', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { ImportExport } = await import('./js/modules/import-export.js');
            return ImportExport._buildExportYaml({
                "Category": {
                    "wildcards": ["Item 1", "Item 2"]
                }
            });
        });
        expect(result).toBe("Category:\n  - Item 1\n  - Item 2\n");
    });

    test('serialization including instruction properties', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { ImportExport } = await import('./js/modules/import-export.js');
            return ImportExport._buildExportYaml({
                "Category": {
                    "instruction": "Test instruction",
                    "wildcards": ["Item 1", "Item 2"]
                }
            });
        });
        expect(result).toBe("Category: # instruction: Test instruction\n  - Item 1\n  - Item 2\n");
    });

    test('nested category serialization verifying proper indentation', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { ImportExport } = await import('./js/modules/import-export.js');
            return ImportExport._buildExportYaml({
                "RootCategory": {
                    "SubCategory": {
                        "wildcards": ["Nested 1", "Nested 2"]
                    }
                }
            });
        });
        expect(result).toBe("RootCategory:\n  SubCategory:\n    - Nested 1\n    - Nested 2\n");
    });

    test('complex objects with multiple nested levels and instructions on multiple levels', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { ImportExport } = await import('./js/modules/import-export.js');
            return ImportExport._buildExportYaml({
                "Root": {
                    "instruction": "Root instruction",
                    "Child": {
                        "instruction": "Child instruction",
                        "wildcards": ["Leaf 1"]
                    },
                    "Sibling": {
                        "wildcards": ["Leaf 2"]
                    }
                }
            });
        });
        expect(result).toBe("Root: # instruction: Root instruction\n  Child: # instruction: Child instruction\n    - Leaf 1\n  Sibling:\n    - Leaf 2\n");
    });

    test('skipping the instruction property at the root level', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { ImportExport } = await import('./js/modules/import-export.js');
            return ImportExport._buildExportYaml({
                "instruction": "This should be skipped",
                "Category": {
                    "wildcards": ["Item 1"]
                }
            });
        });
        expect(result).toBe("Category:\n  - Item 1\n");
    });

    test('empty data case', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { ImportExport } = await import('./js/modules/import-export.js');
            return ImportExport._buildExportYaml({});
        });
        expect(result).toBe("");
    });

    test('null values are ignored correctly', async ({ page }) => {
         const result = await page.evaluate(async () => {
             const { ImportExport } = await import('./js/modules/import-export.js');
             return ImportExport._buildExportYaml({
                 "Category": null,
                 "ValidCategory": {
                     "wildcards": ["Item 1"]
                 }
             });
         });
         expect(result).toBe("ValidCategory:\n  - Item 1\n");
     });
});
