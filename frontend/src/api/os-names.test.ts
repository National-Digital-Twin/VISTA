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
                        GEOMETRY_X: 449979.0,
                        GEOMETRY_Y: 89192.0,
                        MBR_XMIN: 447590.0,
                        MBR_YMIN: 87241.0,
                        MBR_XMAX: 451890.0,
                        MBR_YMAX: 92366.0,
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
                        GEOMETRY_X: 447973.0,
                        GEOMETRY_Y: 88712.0,
                    },
                },
                {
                    GAZETTEER_ENTRY: {
                        NAME1: 'Newport',
                        LOCAL_TYPE: 'Town',
                        GEOMETRY_X: 449979.0,
                        GEOMETRY_Y: 89192.0,
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
});
