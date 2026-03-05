// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { describe, it, expect } from 'vitest';
import { findElement, isAsset, type ElementLike } from './elementUtils';

describe('elementUtils', () => {
    describe('findElement', () => {
        it('finds an element by id', () => {
            const elements: ElementLike[] = [
                { id: '1', elementType: 'asset' },
                { id: '2', elementType: 'asset' },
                { id: '3', elementType: 'asset' },
            ];

            const result = findElement(elements, '2');

            expect(result).toEqual({ id: '2', elementType: 'asset' });
        });

        it('returns undefined when element is not found', () => {
            const elements: ElementLike[] = [
                { id: '1', elementType: 'asset' },
                { id: '2', elementType: 'asset' },
            ];

            const result = findElement(elements, '3');

            expect(result).toBeUndefined();
        });

        it('handles empty array', () => {
            const elements: ElementLike[] = [];

            const result = findElement(elements, '1');

            expect(result).toBeUndefined();
        });

        it('handles undefined array', () => {
            const result = findElement(undefined as any, '1');

            expect(result).toBeUndefined();
        });

        it('works with extended types', () => {
            type ExtendedElement = ElementLike & { name: string };
            const elements: ExtendedElement[] = [
                { id: '1', elementType: 'asset', name: 'Element 1' },
                { id: '2', elementType: 'asset', name: 'Element 2' },
            ];

            const result = findElement(elements, '1');

            expect(result).toEqual({ id: '1', elementType: 'asset', name: 'Element 1' });
        });
    });

    describe('isAsset', () => {
        it('returns true for asset element', () => {
            const element: ElementLike = { id: '1', elementType: 'asset' };

            const result = isAsset(element);

            expect(result).toBe(true);
        });

        it('returns false for undefined element', () => {
            const result = isAsset();

            expect(result).toBe(false);
        });

        it('returns false for element with different elementType', () => {
            const element = { id: '1', elementType: 'other' } as any;

            const result = isAsset(element);

            expect(result).toBe(false);
        });

        it('handles element without elementType property', () => {
            const element = { id: '1' } as any;

            const result = isAsset(element);

            expect(result).toBe(false);
        });

        it('works with extended types', () => {
            type ExtendedElement = ElementLike & { name: string };
            const element: ExtendedElement = { id: '1', elementType: 'asset', name: 'Test' };

            const result = isAsset(element);

            expect(result).toBe(true);
        });
    });
});
