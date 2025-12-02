import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { fetchExposureLayers } from './exposure-layers';

vi.mock('./utils', () => ({
    fetchOptions: {
        headers: {
            'Content-Type': 'application/json',
        },
    },
    createApiEndpoint: (path: string) => `/ndtp-python/api/${path}`,
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
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({
                    type: 'FeatureCollection',
                    features: [
                        {
                            id: '35a910f3-f611-4096-ac0b-0928c5612e32',
                            geometry: 'SRID=4326;POLYGON ((-1.4 50.67, -1.4 50.68, -1.39 50.68, -1.39 50.67, -1.4 50.67))',
                            properties: {
                                name: 'Test Layer 1',
                            },
                        },
                    ],
                }),
            });

            const result = await fetchExposureLayers();

            expect(result.type).toBe('FeatureCollection');
            expect(result.features).toHaveLength(1);
            expect(result.features[0].id).toBe('35a910f3-f611-4096-ac0b-0928c5612e32');
            expect(result.features[0].geometry.type).toBe('Polygon');
            expect(result.features[0].properties?.name).toBe('Test Layer 1');
            expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/exposurelayers/'), {
                headers: { 'Content-Type': 'application/json' },
            });
        });

        it('successfully parses multipolygon geometry', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({
                    type: 'FeatureCollection',
                    features: [
                        {
                            id: 'e34e3c22-a28f-45e5-99b5-a24b55ba875f',
                            geometry: 'SRID=4326;MULTIPOLYGON (((-1.4 50.67, -1.4 50.68, -1.39 50.68, -1.39 50.67, -1.4 50.67)))',
                            properties: {
                                name: 'Test Layer 2',
                            },
                        },
                    ],
                }),
            });

            const result = await fetchExposureLayers();

            expect(result.features).toHaveLength(1);
            expect(result.features[0].geometry.type).toBe('MultiPolygon');
        });

        it('filters out features with invalid geometry', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({
                    type: 'FeatureCollection',
                    features: [
                        {
                            id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
                            geometry: 'SRID=4326;POLYGON ((-1.4 50.67, -1.4 50.68, -1.39 50.68, -1.39 50.67, -1.4 50.67))',
                            properties: {
                                name: 'Valid Layer',
                            },
                        },
                        {
                            id: 'f9e8d7c6-b5a4-3210-9876-543210fedcba',
                            geometry: 'INVALID_FORMAT',
                            properties: {
                                name: 'Invalid Layer',
                            },
                        },
                    ],
                }),
            });

            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            const result = await fetchExposureLayers();

            expect(result.features).toHaveLength(1);
            expect(result.features[0].id).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
            expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to parse geometry for feature:', 'f9e8d7c6-b5a4-3210-9876-543210fedcba', 'Invalid Layer');

            consoleWarnSpy.mockRestore();
        });

        it('handles features with already parsed GeoJSON geometry', async () => {
            const mockGeoJSONGeometry = {
                type: 'Polygon' as const,
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
                json: vi.fn().mockResolvedValue({
                    type: 'FeatureCollection',
                    features: [
                        {
                            id: '12345678-90ab-cdef-1234-567890abcdef',
                            geometry: mockGeoJSONGeometry,
                            properties: {
                                name: 'Test Layer 3',
                            },
                        },
                    ],
                }),
            });

            const result = await fetchExposureLayers();

            expect(result.features).toHaveLength(1);
            expect(result.features[0].geometry).toEqual(mockGeoJSONGeometry);
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

        it('handles empty feature collection', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({
                    type: 'FeatureCollection',
                    features: [],
                }),
            });

            const result = await fetchExposureLayers();

            expect(result.type).toBe('FeatureCollection');
            expect(result.features).toHaveLength(0);
        });

        it('handles features without properties', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({
                    type: 'FeatureCollection',
                    features: [
                        {
                            id: '98765432-10fe-dcba-9876-543210fedcba',
                            geometry: 'SRID=4326;POLYGON ((-1.4 50.67, -1.4 50.68, -1.39 50.68, -1.39 50.67, -1.4 50.67))',
                        },
                    ],
                }),
            });

            const result = await fetchExposureLayers();

            expect(result.features).toHaveLength(1);
            expect(result.features[0].properties).toEqual({});
        });
    });
});
