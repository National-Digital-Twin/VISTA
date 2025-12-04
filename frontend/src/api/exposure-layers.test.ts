import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Geometry } from 'geojson';

import { fetchExposureLayers } from './exposure-layers';

vi.mock('@/config/app-config', () => ({
    default: {
        services: {
            apiBaseUrl: '/ndtp-python/api',
        },
    },
}));

describe('exposure-layers API', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as any;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('fetchExposureLayers', () => {
        it('successfully fetches exposure layers with polygon geometry', async () => {
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

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue([
                    {
                        id: 'group-1',
                        name: 'Floods',
                        exposureLayers: [
                            {
                                id: '35a910f3-f611-4096-ac0b-0928c5612e32',
                                name: 'Test Layer 1',
                                geometry: mockGeometry,
                            },
                        ],
                    },
                ]),
            });

            const result = await fetchExposureLayers();

            expect(result.featureCollection.type).toBe('FeatureCollection');
            expect(result.featureCollection.features).toHaveLength(1);
            expect(result.featureCollection.features[0].id).toBe('35a910f3-f611-4096-ac0b-0928c5612e32');
            expect(result.featureCollection.features[0].geometry.type).toBe('Polygon');
            expect(result.featureCollection.features[0].properties?.name).toBe('Test Layer 1');
            expect(result.featureCollection.features[0].properties?.groupId).toBe('group-1');
            expect(result.featureCollection.features[0].properties?.groupName).toBe('Floods');
            expect(result.groups).toHaveLength(1);
            expect(result.groups[0].id).toBe('group-1');
            expect(result.groups[0].name).toBe('Floods');
            expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/ndtp-python/api/exposurelayers/'), {
                headers: { 'Content-Type': 'application/json' },
            });
        });

        it('successfully handles multipolygon geometry', async () => {
            const mockGeometry: Geometry = {
                type: 'MultiPolygon',
                coordinates: [
                    [
                        [
                            [-1.4, 50.67],
                            [-1.4, 50.68],
                            [-1.39, 50.68],
                            [-1.39, 50.67],
                            [-1.4, 50.67],
                        ],
                    ],
                ],
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue([
                    {
                        id: 'group-1',
                        name: 'Floods',
                        exposureLayers: [
                            {
                                id: 'e34e3c22-a28f-45e5-99b5-a24b55ba875f',
                                name: 'Test Layer 2',
                                geometry: mockGeometry,
                            },
                        ],
                    },
                ]),
            });

            const result = await fetchExposureLayers();

            expect(result.featureCollection.features).toHaveLength(1);
            expect(result.featureCollection.features[0].geometry.type).toBe('MultiPolygon');
        });

        it('filters out layers with missing geometry', async () => {
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

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue([
                    {
                        id: 'group-1',
                        name: 'Floods',
                        exposureLayers: [
                            {
                                id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
                                name: 'Valid Layer',
                                geometry: mockGeometry,
                            },
                            {
                                id: 'f9e8d7c6-b5a4-3210-9876-543210fedcba',
                                name: 'Invalid Layer',
                                geometry: null as any,
                            },
                        ],
                    },
                ]),
            });

            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            const result = await fetchExposureLayers();

            expect(result.featureCollection.features).toHaveLength(1);
            expect(result.featureCollection.features[0].id).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
            expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to parse geometry for layer:', 'f9e8d7c6-b5a4-3210-9876-543210fedcba', 'Invalid Layer');

            consoleWarnSpy.mockRestore();
        });

        it('handles multiple groups with multiple layers', async () => {
            const mockGeometry1: Geometry = {
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

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue([
                    {
                        id: 'group-1',
                        name: 'Floods',
                        exposureLayers: [
                            {
                                id: 'layer-1',
                                name: 'Test Layer 1',
                                geometry: mockGeometry1,
                            },
                        ],
                    },
                    {
                        id: 'group-2',
                        name: 'Environmentally sensitive areas',
                        exposureLayers: [
                            {
                                id: 'layer-2',
                                name: 'Test Layer 2',
                                geometry: mockGeometry2,
                            },
                        ],
                    },
                ]),
            });

            const result = await fetchExposureLayers();

            expect(result.featureCollection.features).toHaveLength(2);
            expect(result.groups).toHaveLength(2);
            expect(result.groups[0].name).toBe('Floods');
            expect(result.groups[1].name).toBe('Environmentally sensitive areas');
            expect(result.featureCollection.features[0].properties?.groupName).toBe('Floods');
            expect(result.featureCollection.features[1].properties?.groupName).toBe('Environmentally sensitive areas');
        });

        it('throws error when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
            });

            await expect(fetchExposureLayers()).rejects.toThrow('Failed to retrieve exposure layers: Internal Server Error');
        });

        it('throws error on network failure', async () => {
            fetchMock.mockRejectedValue(new Error('Network error'));

            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await expect(fetchExposureLayers()).rejects.toThrow('Network error');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching exposure layers:', expect.any(Error));

            consoleErrorSpy.mockRestore();
        });

        it('handles empty groups array', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue([]),
            });

            const result = await fetchExposureLayers();

            expect(result.featureCollection.type).toBe('FeatureCollection');
            expect(result.featureCollection.features).toHaveLength(0);
            expect(result.groups).toHaveLength(0);
        });

        it('handles groups with empty exposure layers', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue([
                    {
                        id: 'group-1',
                        name: 'Floods',
                        exposureLayers: [],
                    },
                    {
                        id: 'group-2',
                        name: 'Environmentally sensitive areas',
                        exposureLayers: [],
                    },
                ]),
            });

            const result = await fetchExposureLayers();

            expect(result.featureCollection.features).toHaveLength(0);
            expect(result.groups).toHaveLength(2);
            expect(result.groups[0].exposureLayers).toHaveLength(0);
            expect(result.groups[1].exposureLayers).toHaveLength(0);
        });
    });
});
