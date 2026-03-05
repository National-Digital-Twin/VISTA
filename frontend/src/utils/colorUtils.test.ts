// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import ColorScale from 'color-scales';
import { describe, it, expect } from 'vitest';
import { getColorScale, getHexColor } from './colorUtils';

describe('colorUtils', () => {
    describe('getColorScale', () => {
        it('creates a ColorScale instance', () => {
            const scale = getColorScale(0, 100);

            expect(scale).toBeInstanceOf(ColorScale);
        });

        it('handles max value of 0 by setting max to 100', () => {
            const scale = getColorScale(0, 0);
            const result = getHexColor(scale, 50);

            expect(result).toBeDefined();
            expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
        });

        it('handles negative min value', () => {
            const scale = getColorScale(-10, 10);
            const result = getHexColor(scale, 0);

            expect(result).toBeDefined();
            expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
        });

        it('handles large values', () => {
            const scale = getColorScale(1000, 5000);
            const result = getHexColor(scale, 3000);

            expect(result).toBeDefined();
            expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
        });

        it('produces different colors for different values', () => {
            const scale = getColorScale(0, 100);
            const color1 = getHexColor(scale, 0);
            const color2 = getHexColor(scale, 100);

            expect(color1).toBeDefined();
            expect(color2).toBeDefined();
            expect(color1).not.toBe(color2);
        });
    });

    describe('getHexColor', () => {
        it('returns hex color string for valid colorScale and value', () => {
            const colorScale = getColorScale(0, 100);
            const result = getHexColor(colorScale, 50);

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
            expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
        });

        it('returns undefined for null colorScale', () => {
            const result = getHexColor(null, 50);

            expect(result).toBeUndefined();
        });

        it('handles value at minimum', () => {
            const colorScale = getColorScale(0, 100);
            const result = getHexColor(colorScale, 0);

            expect(result).toBeDefined();
            expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
        });

        it('handles value at maximum', () => {
            const colorScale = getColorScale(0, 100);
            const result = getHexColor(colorScale, 100);

            expect(result).toBeDefined();
            expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
        });

        it('handles value outside range', () => {
            const colorScale = getColorScale(0, 100);
            const result = getHexColor(colorScale, 150);

            expect(result).toBeDefined();
            expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
        });

        it('handles negative value', () => {
            const colorScale = getColorScale(-10, 10);
            const result = getHexColor(colorScale, -5);

            expect(result).toBeDefined();
            expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
        });

        it('handles decimal value', () => {
            const colorScale = getColorScale(0, 100);
            const result = getHexColor(colorScale, 50.5);

            expect(result).toBeDefined();
            expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
        });
    });
});
