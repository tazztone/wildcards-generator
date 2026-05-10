/**
 * Validates data against a given schema.
 * This is a simplified validator for the app's specific schema format,
 * which is inspired by JSON Schema and Google's API discovery service format.
 *
 * @param {*} data The data to validate.
 * @param {object} schema The schema definition.
 * @param {string} [path='root'] The current path for error reporting.
 * @returns {{isValid: boolean, errors: string[]}} An object containing a boolean indicating validity and an array of error messages.
 */
export function validate(data, schema, path = 'root') {
    const errors = [];

    if (!schema || typeof schema !== 'object') {
        errors.push(`${path}: Invalid schema definition provided.`);
        return { isValid: false, errors };
    }

    if (!schema.type) {
        errors.push(`${path}: Schema is missing the "type" property.`);
        return { isValid: false, errors };
    }

    switch (schema.type) {
        case 'OBJECT':
            if (typeof data !== 'object' || data === null || Array.isArray(data)) {
                errors.push(`${path}: Expected an object, but got ${data === null ? 'null' : typeof data}.`);
                break;
            }

            // Check for required properties
            if (schema.required) {
                for (const key of schema.required) {
                    if (!(key in data)) {
                        errors.push(`${path}: Missing required property "${key}".`);
                    }
                }
            }

            // Validate properties recursively
            if (schema.properties) {
                for (const key in data) {
                    if (schema.properties[key]) {
                        const nestedValidation = validate(data[key], schema.properties[key], `${path}.${key}`);
                        if (!nestedValidation.isValid) {
                            errors.push(...nestedValidation.errors);
                        }
                    }
                }
            }
            break;

        case 'ARRAY':
            if (!Array.isArray(data)) {
                errors.push(`${path}: Expected an array, but got ${typeof data}.`);
                break;
            }

            // Validate array items recursively
            if (schema.items) {
                data.forEach((item, index) => {
                    const itemValidation = validate(item, schema.items, `${path}[${index}]`);
                    if (!itemValidation.isValid) {
                        errors.push(...itemValidation.errors);
                    }
                });
            }
            break;

        case 'STRING':
            if (typeof data !== 'string') {
                errors.push(`${path}: Expected a string, but got ${typeof data}.`);
            }
            break;

        default:
            errors.push(`${path}: Unknown schema type "${schema.type}".`);
            break;
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}
