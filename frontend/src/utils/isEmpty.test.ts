import { describe, it, expect } from 'vitest';
import { isEmpty } from './isEmpty';

describe('isEmpty', () => {
    describe('null and undefined', () => {
        it('returns true for null', () => {
            expect(isEmpty(null)).toBe(true);
        });

        it('returns true for undefined', () => {
            expect(isEmpty(undefined)).toBe(true);
        });
    });

    describe('strings', () => {
        it('returns true for empty string', () => {
            expect(isEmpty('')).toBe(true);
        });

        it('returns false for non-empty string', () => {
            expect(isEmpty('hello')).toBe(false);
        });
    });

    describe('arrays', () => {
        it('returns true for empty array', () => {
            expect(isEmpty([])).toBe(true);
        });

        it('returns false for non-empty array', () => {
            expect(isEmpty([1, 2, 3])).toBe(false);
        });
    });

    describe('objects', () => {
        it('returns true for empty object', () => {
            expect(isEmpty({})).toBe(true);
        });

        it('returns false for object with properties', () => {
            expect(isEmpty({ key: 'value' })).toBe(false);
        });
    });

    describe('Maps', () => {
        it('returns true for empty Map', () => {
            expect(isEmpty(new Map())).toBe(true);
        });

        it('returns false for non-empty Map', () => {
            const map = new Map();
            map.set('key', 'value');
            expect(isEmpty(map)).toBe(false);
        });
    });

    describe('Sets', () => {
        it('returns true for empty Set', () => {
            expect(isEmpty(new Set())).toBe(true);
        });

        it('returns false for non-empty Set', () => {
            const set = new Set();
            set.add('value');
            expect(isEmpty(set)).toBe(false);
        });
    });

    describe('primitives', () => {
        it('returns true for numbers', () => {
            expect(isEmpty(0)).toBe(true);
            expect(isEmpty(42)).toBe(true);
        });

        it('returns true for booleans', () => {
            expect(isEmpty(true)).toBe(true);
            expect(isEmpty(false)).toBe(true);
        });
    });
});
