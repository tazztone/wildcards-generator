import { test, expect } from '@playwright/test';

test.describe('Schema Validator', () => {
    let validate;

    test.beforeAll(async () => {
        // Since the validator is a plain JS module with no dependencies, we can import it directly.
        const module = await import('../js/schema-validator.js');
        validate = module.validate;
    });

    test('should validate a simple array of strings', () => {
        const schema = { type: 'ARRAY', items: { type: 'STRING' } };
        const data = ['a', 'b', 'c'];
        const { isValid, errors } = validate(data, schema);
        expect(isValid).toBe(true);
        expect(errors).toEqual([]);
    });

    test('should fail validation for an array with non-string items', () => {
        const schema = { type: 'ARRAY', items: { type: 'STRING' } };
        const data = ['a', 123, 'c'];
        const { isValid, errors } = validate(data, schema);
        expect(isValid).toBe(false);
        expect(errors).toContain('root[1]: Expected a string, but got number');
    });

    test('should fail validation if data is not an array', () => {
        const schema = { type: 'ARRAY', items: { type: 'STRING' } };
        const data = { not: 'an array' };
        const { isValid, errors } = validate(data, schema);
        expect(isValid).toBe(false);
        expect(errors).toContain('root: Expected an array, but got object');
    });

    test('should validate a simple object', () => {
        const schema = {
            type: 'OBJECT',
            properties: {
                name: { type: 'STRING' },
                value: { type: 'STRING' }
            },
            required: ['name']
        };
        const data = { name: 'test', value: 'hello' };
        const { isValid, errors } = validate(data, schema);
        expect(isValid).toBe(true);
        expect(errors).toEqual([]);
    });

    test('should fail validation if a required object property is missing', () => {
        const schema = {
            type: 'OBJECT',
            properties: {
                name: { type: 'STRING' },
                value: { type: 'STRING' }
            },
            required: ['name']
        };
        const data = { value: 'hello' };
        const { isValid, errors } = validate(data, schema);
        expect(isValid).toBe(false);
        expect(errors).toContain('root: Missing required property "name"');
    });

    test('should fail validation if an object property has the wrong type', () => {
        const schema = {
            type: 'OBJECT',
            properties: {
                name: { type: 'STRING' }
            }
        };
        const data = { name: 123 };
        const { isValid, errors } = validate(data, schema);
        expect(isValid).toBe(false);
        expect(errors).toContain('root.name: Expected a string, but got number');
    });

    test('should validate a nested object', () => {
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
        const { isValid, errors } = validate(data, schema);
        expect(isValid).toBe(true);
    });

    test('should fail validation for a nested object with errors', () => {
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
        const { isValid, errors } = validate(data, schema);
        expect(isValid).toBe(false);
        expect(errors).toContain('root.data.id: Expected a string, but got number');
    });

    test('should validate an array of objects', () => {
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
        const { isValid, errors } = validate(data, schema);
        expect(isValid).toBe(true);
    });

    test('should fail validation for an array of objects with missing required properties', () => {
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
        const { isValid, errors } = validate(data, schema);
        expect(isValid).toBe(false);
        expect(errors).toContain('root[1]: Missing required property "instruction"');
    });

    test('should handle invalid schema definitions gracefully', () => {
        const schema = { type: 'INVALID_TYPE' };
        const data = {};
        const { isValid, errors } = validate(data, schema);
        expect(isValid).toBe(false);
        expect(errors).toContain('root: Unknown schema type "INVALID_TYPE"');
    });

    test('should return an error if schema has no type', () => {
        const schema = { properties: {} };
        const data = {};
        const { isValid, errors } = validate(data, schema);
        expect(isValid).toBe(false);
        expect(errors).toContain('root: Schema is missing the "type" property.');
    });
});
