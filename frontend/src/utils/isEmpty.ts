export function isEmpty(value: any): boolean {
    if (typeof value === 'string' || value instanceof Array) {
        // Checks for empty string or array
        return value.length === 0;
    }

    if (value instanceof Map || value instanceof Set) {
        // Checks for empty Map or Set
        return value.size === 0;
    }

    if (typeof value === 'object') {
        // Checks for empty object
        return Object.keys(value).length === 0;
    }

    // lodash considers all atoms empty, and we replicate that here
    return true;
}
