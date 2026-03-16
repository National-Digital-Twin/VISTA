// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchOsNamesLocations } from './os-names';

describe('searchOsNamesLocations', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('converts OSGB coordinates to WGS84 for map fly-to', async () => {
        const mockResponse = {
            results: [
                {
                    GAZETTEER_ENTRY: {
                        NAME1: 'Newport',
                        LOCAL_TYPE: 'Town',
                        GEOMETRY_X: 449979,
                        GEOMETRY_Y: 89192,
                        MBR_XMIN: 447590,
                        MBR_YMIN: 87241,
                        MBR_XMAX: 451890,
                        MBR_YMAX: 92366,
                    },
                },
            ],
        };

        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockResponse,
            }),
        );

        const results = await searchOsNamesLocations('newport');

        expect(results).toHaveLength(1);
        expect(results[0].label).toBe('Newport (Town)');
        expect(results[0].lng).toBeGreaterThan(-2);
        expect(results[0].lng).toBeLessThan(-1);
        expect(results[0].lat).toBeGreaterThan(50);
        expect(results[0].lat).toBeLessThan(51);
        expect(results[0].bounds).toBeDefined();
        expect(results[0].bounds![0][0]).toBeGreaterThan(-2);
        expect(results[0].bounds![0][0]).toBeLessThan(-1);
        expect(results[0].bounds![0][1]).toBeGreaterThan(50);
        expect(results[0].bounds![0][1]).toBeLessThan(51);
    });

    it('prioritizes NAME1 prefix matches and towns for ranking', async () => {
        const mockResponse = {
            results: [
                {
                    GAZETTEER_ENTRY: {
                        NAME1: 'Bramleys',
                        LOCAL_TYPE: 'Named Road',
                        GEOMETRY_X: 447973,
                        GEOMETRY_Y: 88712,
                    },
                },
                {
                    GAZETTEER_ENTRY: {
                        NAME1: 'Newport',
                        LOCAL_TYPE: 'Town',
                        GEOMETRY_X: 449979,
                        GEOMETRY_Y: 89192,
                    },
                },
            ],
        };

        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockResponse,
            }),
        );

        const results = await searchOsNamesLocations('Newp');

        expect(results).toHaveLength(2);
        expect(results[0].name).toBe('Newport');
        expect(results[0].label).toBe('Newport (Town)');
    });

    it('includes populated place in labels for disambiguation when available', async () => {
        const mockResponse = {
            results: [
                {
                    GAZETTEER_ENTRY: {
                        NAME1: 'High Street',
                        LOCAL_TYPE: 'Named Road',
                        POPULATED_PLACE: 'Newport',
                        GEOMETRY_X: 449979,
                        GEOMETRY_Y: 89192,
                    },
                },
            ],
        };

        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockResponse,
            }),
        );

        const results = await searchOsNamesLocations('High Street');

        expect(results).toHaveLength(1);
        expect(results[0].label).toBe('High Street, Newport (Named Road)');
        expect(results[0].populatedPlace).toBe('Newport');
    });
});
