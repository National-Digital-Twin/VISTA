import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Geometry } from 'geojson';

import { fetchExposureLayers, fetchExposureLayerGeometry, fetchExposureLayerVisibility, mergeGeometryWithVisibility } from './exposure-layers';

vi.mock('@/config/app-config', () => ({
    default: {
        services: {
            apiBaseUrl: '/ndtp-python/api',
        },
    },
}));

describe('exposure-layers API', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    const mockGeometry: Geometry = {
        type: 'Polygon',
        coordinates: [
            [
                [-1.4, 50.67],
                [-1.4, 50.68],
                [-1.39, 50.68],
                [-1.39, 50.67],
                [-1.4, 50.67],
            ],
        ],
    };

    const mockGeometry2: Geometry = {
        type: 'Polygon',
        coordinates: [
            [
                [-1.3, 50.66],
                [-1.3, 50.67],
                [-1.29, 50.67],
                [-1.29, 50.66],
                [-1.3, 50.66],
            ],
        ],
    };

    beforeEach(() => {
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as typeof fetch;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('fetchExposureLayerGeometry', () => {
        it('fetches geometry from exposurelayers endpoint', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue([
                    {
                        id: 'group-1',
                        name: 'Floods',
                        exposureLayers: [{ id: 'layer-1', name: 'Test Layer 1', geometry: mockGeometry }],
                    },
                ]),
            });

            const result = await fetchExposureLayerGeometry();

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('group-1');
            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/exposurelayers/', {
                headers: { 'Content-Type': 'application/json' },
            });
        });

        it('throws error when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                statusText: 'Internal Server Error',
            });

            await expect(fetchExposureLayerGeometry()).rejects.toThrow('Failed to retrieve exposure layer geometry: Internal Server Error');
        });
    });

    describe('fetchExposureLayerVisibility', () => {
        it('fetches visibility from scenario endpoint with focus_area_id', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue([
                    {
                        id: 'group-1',
                        name: 'Floods',
                        exposureLayers: [{ id: 'layer-1', name: 'Test Layer 1', isActive: true }],
                    },
                ]),
            });

            const result = await fetchExposureLayerVisibility('scenario-1', 'focus-area-1');

            expect(result).toHaveLength(1);
            expect(result[0].exposureLayers[0].isActive).toBe(true);
            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-1/exposure-layers/?focus_area_id=focus-area-1', {
                headers: { 'Content-Type': 'application/json' },
            });
        });

        it('throws error when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                statusText: 'Internal Server Error',
            });

            await expect(fetchExposureLayerVisibility('scenario-1', 'focus-area-1')).rejects.toThrow(
                'Failed to retrieve exposure layer visibility: Internal Server Error',
            );
        });
    });

    describe('mergeGeometryWithVisibility', () => {
        it('merges geometry and visibility data', () => {
            const geometryData = [
                {
                    id: 'group-1',
                    name: 'Floods',
                    exposureLayers: [
                        { id: 'layer-1', name: 'Test Layer 1', geometry: mockGeometry },
                        { id: 'layer-2', name: 'Test Layer 2', geometry: mockGeometry2 },
                    ],
                },
            ];

            const visibilityData = [
                {
                    id: 'group-1',
                    name: 'Floods',
                    exposureLayers: [
                        { id: 'layer-1', name: 'Test Layer 1', isActive: true },
                        { id: 'layer-2', name: 'Test Layer 2', isActive: false },
                    ],
                },
            ];

            const result = mergeGeometryWithVisibility(geometryData, visibilityData);

            expect(result.groups[0].exposureLayers[0].isActive).toBe(true);
            expect(result.groups[0].exposureLayers[1].isActive).toBe(false);
            expect(result.featureCollection.features[0].properties?.isActive).toBe(true);
            expect(result.featureCollection.features[1].properties?.isActive).toBe(false);
        });

        it('returns empty groups when visibility data is empty', () => {
            const geometryData = [
                {
                    id: 'group-1',
                    name: 'Floods',
                    exposureLayers: [{ id: 'layer-1', name: 'Test Layer 1', geometry: mockGeometry }],
                },
            ];

            const visibilityData: typeof geometryData = [];

            const result = mergeGeometryWithVisibility(geometryData, visibilityData);

            expect(result.groups).toHaveLength(0);
            expect(result.featureCollection.features).toHaveLength(0);
        });

        it('filters out layers without geometry in featureCollection', () => {
            const geometryData = [
                {
                    id: 'group-1',
                    name: 'Floods',
                    exposureLayers: [
                        { id: 'layer-1', name: 'Test Layer 1', geometry: mockGeometry },
                        { id: 'layer-2', name: 'Test Layer 2', geometry: undefined },
                    ],
                },
            ];

            const visibilityData = [
                {
                    id: 'group-1',
                    name: 'Floods',
                    exposureLayers: [
                        { id: 'layer-1', name: 'Test Layer 1', isActive: true },
                        { id: 'layer-2', name: 'Test Layer 2', isActive: true },
                    ],
                },
            ];

            const result = mergeGeometryWithVisibility(geometryData, visibilityData);

            expect(result.featureCollection.features).toHaveLength(1);
            expect(result.groups[0].exposureLayers).toHaveLength(2);
        });
    });

    describe('fetchExposureLayers', () => {
        it('fetches and merges geometry and visibility data', async () => {
            fetchMock
                .mockResolvedValueOnce({
                    ok: true,
                    json: vi.fn().mockResolvedValue([
                        {
                            id: 'group-1',
                            name: 'Floods',
                            exposureLayers: [{ id: 'layer-1', name: 'Test Layer 1', geometry: mockGeometry }],
                        },
                    ]),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: vi.fn().mockResolvedValue([
                        {
                            id: 'group-1',
                            name: 'Floods',
                            exposureLayers: [{ id: 'layer-1', name: 'Test Layer 1', isActive: true }],
                        },
                    ]),
                });

            const result = await fetchExposureLayers('scenario-1', 'focus-area-1');

            expect(result.featureCollection.type).toBe('FeatureCollection');
            expect(result.featureCollection.features).toHaveLength(1);
            expect(result.featureCollection.features[0].properties?.isActive).toBe(true);
            expect(fetchMock).toHaveBeenCalledTimes(2);
        });

        it('includes focusAreaId in visibility fetch URL', async () => {
            fetchMock
                .mockResolvedValueOnce({
                    ok: true,
                    json: vi.fn().mockResolvedValue([]),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: vi.fn().mockResolvedValue([]),
                });

            await fetchExposureLayers('scenario-1', 'focus-area-1');

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/exposurelayers/', expect.any(Object));
            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-1/exposure-layers/?focus_area_id=focus-area-1', expect.any(Object));
        });

        it('handles empty groups array', async () => {
            fetchMock
                .mockResolvedValueOnce({
                    ok: true,
                    json: vi.fn().mockResolvedValue([]),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: vi.fn().mockResolvedValue([]),
                });

            const result = await fetchExposureLayers('scenario-1', 'focus-area-1');

            expect(result.featureCollection.type).toBe('FeatureCollection');
            expect(result.featureCollection.features).toHaveLength(0);
            expect(result.groups).toHaveLength(0);
        });

        it('throws error when geometry fetch fails', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                statusText: 'Internal Server Error',
            });

            await expect(fetchExposureLayers('scenario-1', 'focus-area-1')).rejects.toThrow(
                'Failed to retrieve exposure layer geometry: Internal Server Error',
            );
        });

        it('throws error when visibility fetch fails', async () => {
            fetchMock
                .mockResolvedValueOnce({
                    ok: true,
                    json: vi.fn().mockResolvedValue([]),
                })
                .mockResolvedValueOnce({
                    ok: false,
                    statusText: 'Internal Server Error',
                });

            await expect(fetchExposureLayers('scenario-1', 'focus-area-1')).rejects.toThrow(
                'Failed to retrieve exposure layer visibility: Internal Server Error',
            );
        });
    });
});
