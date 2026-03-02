import { describe, it, expect } from 'vitest';
import { getStockLevel, getStockColor, STOCK_LEVEL_COLORS } from './stockLevels';

describe('stockLevels', () => {
    describe('getStockLevel', () => {
        it('returns low when percentage is 0%', () => {
            expect(getStockLevel(0, 100)).toBe('low');
        });

        it('returns low when percentage is 19%', () => {
            expect(getStockLevel(19, 100)).toBe('low');
        });

        it('returns medium when percentage is 20%', () => {
            expect(getStockLevel(20, 100)).toBe('medium');
        });

        it('returns medium when percentage is 49%', () => {
            expect(getStockLevel(49, 100)).toBe('medium');
        });

        it('returns high when percentage is 50%', () => {
            expect(getStockLevel(50, 100)).toBe('high');
        });

        it('returns high when percentage is 100%', () => {
            expect(getStockLevel(100, 100)).toBe('high');
        });

        it('returns low when maxCapacity is 0', () => {
            expect(getStockLevel(0, 0)).toBe('low');
        });

        it('returns low when maxCapacity is negative', () => {
            expect(getStockLevel(5, -1)).toBe('low');
        });
    });

    describe('getStockColor', () => {
        it('returns red for low stock', () => {
            expect(getStockColor(0, 100)).toBe(STOCK_LEVEL_COLORS.low);
        });

        it('returns orange for medium stock', () => {
            expect(getStockColor(30, 100)).toBe(STOCK_LEVEL_COLORS.medium);
        });

        it('returns green for high stock', () => {
            expect(getStockColor(80, 100)).toBe(STOCK_LEVEL_COLORS.high);
        });
    });
});
