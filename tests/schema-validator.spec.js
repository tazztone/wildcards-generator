import { test, expect } from '@playwright/test';

test.describe('Schema Validator', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should validate a simple array of strings', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { validate } = await import('/js/schema-validator.js');
            const schema = { type: 'ARRAY', items: { type: 'STRING' } };
            const data = ['a', 'b', 'c'];
            return validate(data, schema);
        });
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    test('should fail validation for an array with non-string items', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { validate } = await import('/js/schema-validator.js');
            const schema = { type: 'ARRAY', items: { type: 'STRING' } };
            const data = ['a', 123, 'c'];
            return validate(data, schema);
        });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('root[1]: Expected a string, but got number.');
    });

    test('should fail validation if data is not an array', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { validate } = await import('/js/schema-validator.js');
            const schema = { type: 'ARRAY', items: { type: 'STRING' } };
            const data = { not: 'an array' };
            return validate(data, schema);
        });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('root: Expected an array, but got object.');
    });

    test('should validate a simple object', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { validate } = await import('/js/schema-validator.js');
            const schema = {
                type: 'OBJECT',
                properties: {
                    name: { type: 'STRING' },
                    value: { type: 'STRING' }
                },
                required: ['name']
            };
            const data = { name: 'test', value: 'hello' };
            return validate(data, schema);
        });
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    test('should fail validation if a required object property is missing', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { validate } = await import('/js/schema-validator.js');
            const schema = {
                type: 'OBJECT',
                properties: {
                    name: { type: 'STRING' },
                    value: { type: 'STRING' }
                },
                required: ['name']
            };
            const data = { value: 'hello' };
            return validate(data, schema);
        });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('root: Missing required property "name".');
    });

    test('should fail validation if an object property has the wrong type', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { validate } = await import('/js/schema-validator.js');
            const schema = {
                type: 'OBJECT',
                properties: {
                    name: { type: 'STRING' }
                }
            };
            const data = { name: 123 };
            return validate(data, schema);
        });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('root.name: Expected a string, but got number.');
    });

    test('should validate a nested object', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { validate } = await import('/js/schema-validator.js');
            const schema = {
                type: 'OBJECT',
                properties: {
                    data: {
                        type: 'OBJECT',
                        properties: {
                            id: { type: 'STRING' }
                        },
                        required: ['id']
                    }
                }
            };
            const data = { data: { id: 'abc-123' } };
            return validate(data, schema);
        });
        expect(result.isValid).toBe(true);
    });

    test('should fail validation for a nested object with errors', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { validate } = await import('/js/schema-validator.js');
            const schema = {
                type: 'OBJECT',
                properties: {
                    data: {
                        type: 'OBJECT',
                        properties: {
                            id: { type: 'STRING' }
                        },
                        required: ['id']
                    }
                }
            };
            const data = { data: { id: 123 } };
            return validate(data, schema);
        });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('root.data.id: Expected a string, but got number.');
    });

    test('should validate an array of objects', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { validate } = await import('/js/schema-validator.js');
            const schema = {
                type: 'ARRAY',
                items: {
                    type: 'OBJECT',
                    properties: {
                        name: { type: 'STRING' },
                        instruction: { type: 'STRING' }
                    },
                    required: ['name', 'instruction']
                }
            };
            const data = [
                { name: 'item_one', instruction: 'First item' },
                { name: 'item_two', instruction: 'Second item' }
            ];
            return validate(data, schema);
        });
        expect(result.isValid).toBe(true);
    });

    test('should fail validation for an array of objects with missing required properties', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { validate } = await import('/js/schema-validator.js');
            const schema = {
                type: 'ARRAY',
                items: {
                    type: 'OBJECT',
                    properties: {
                        name: { type: 'STRING' },
                        instruction: { type: 'STRING' }
                    },
                    required: ['name', 'instruction']
                }
            };
            const data = [
                { name: 'item_one', instruction: 'First item' },
                { name: 'item_two' } // Missing instruction
            ];
            return validate(data, schema);
        });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('root[1]: Missing required property "instruction".');
    });

    test('should handle invalid schema definitions gracefully', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { validate } = await import('/js/schema-validator.js');
            const schema = { type: 'INVALID_TYPE' };
            const data = {};
            return validate(data, schema);
        });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('root: Unknown schema type "INVALID_TYPE".');
    });

    test('should return an error if schema has no type', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { validate } = await import('/js/schema-validator.js');
            const schema = { properties: {} };
            const data = {};
            return validate(data, schema);
        });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('root: Schema is missing the "type" property.');
    });
});
