// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchAssetsByType } from './assets-by-type';

vi.mock('@/config/app-config', () => ({
    default: {
        services: {
            apiBaseUrl: '/ndtp-python/api',
        },
    },
}));

describe('assets-by-type API', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as any;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('fetchAssetsByType', () => {
        const mockAssetTypeId = '35a910f3-f611-4096-ac0b-0928c5612e32';

        it('successfully fetches assets with point geometry', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue([
                    {
                        id: 'asset-1',
                        name: 'Test Asset 1',
                        geom: 'SRID=4326;POINT (-1.4 50.67)',
                        type: {
                            id: mockAssetTypeId,
                            name: 'Hospital',
                        },
                    },
                ]),
            });

            const result = await fetchAssetsByType(mockAssetTypeId);

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('asset-1');
            expect(result[0].name).toBe('Test Asset 1');
            expect(result[0].geometry.type).toBe('Point');
            expect(result[0].lat).toBe(50.67);
            expect(result[0].lng).toBe(-1.4);
            expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining(`/ndtp-python/api/assets/?asset_type=${encodeURIComponent(mockAssetTypeId)}`), {
                headers: { 'Content-Type': 'application/json' },
            });
        });

        it('successfully fetches assets with polygon geometry', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue([
                    {
                        id: 'asset-2',
                        name: 'Test Asset 2',
                        geom: 'SRID=4326;POLYGON ((-1.4 50.67, -1.4 50.68, -1.39 50.68, -1.39 50.67, -1.4 50.67))',
                        type: {
                            id: mockAssetTypeId,
                            name: 'Building',
                        },
                    },
                ]),
            });

            const result = await fetchAssetsByType(mockAssetTypeId);

            expect(result).toHaveLength(1);
            expect(result[0].geometry.type).toBe('Polygon');
            expect(typeof result[0].lat).toBe('number');
            expect(typeof result[0].lng).toBe('number');
        });

        it('successfully fetches assets with multipolygon geometry', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue([
                    {
                        id: 'asset-3',
                        name: 'Test Asset 3',
                        geom: 'SRID=4326;MULTIPOLYGON (((-1.4 50.67, -1.4 50.68, -1.39 50.68, -1.39 50.67, -1.4 50.67)))',
                        type: {
                            id: mockAssetTypeId,
                            name: 'Complex Building',
                        },
                    },
                ]),
            });

            const result = await fetchAssetsByType(mockAssetTypeId);

            expect(result).toHaveLength(1);
            expect(result[0].geometry.type).toBe('MultiPolygon');
        });

        it('successfully fetches assets with linestring geometry', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue([
                    {
                        id: 'asset-4',
                        name: 'Test Asset 4',
                        geom: 'SRID=4326;LINESTRING (-1.4 50.67, -1.4 50.68, -1.39 50.68)',
                        type: {
                            id: mockAssetTypeId,
                            name: 'Road',
                        },
                    },
                ]),
            });

            const result = await fetchAssetsByType(mockAssetTypeId);

            expect(result).toHaveLength(1);
            expect(result[0].geometry.type).toBe('LineString');
            expect(result[0].lat).toBe(50.67);
            expect(result[0].lng).toBe(-1.4);
        });

        it('applies icon map when provided', async () => {
            const iconMap = new Map<string, string>();
            iconMap.set(mockAssetTypeId, 'fa-hospital');

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue([
                    {
                        id: 'asset-5',
                        name: 'Test Asset 5',
                        geom: 'SRID=4326;POINT (-1.4 50.67)',
                        type: {
                            id: mockAssetTypeId,
                            name: 'Hospital',
                        },
                    },
                ]),
            });

            const result = await fetchAssetsByType(mockAssetTypeId, iconMap);

            expect(result[0].styles.faIcon).toBe('fa-hospital');
            expect(result[0].styles.iconFallbackText).toBe('hospital');
        });

        it('handles missing icon in icon map', async () => {
            const iconMap = new Map<string, string>();

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue([
                    {
                        id: 'asset-6',
                        name: 'Test Asset 6',
                        geom: 'SRID=4326;POINT (-1.4 50.67)',
                        type: {
                            id: mockAssetTypeId,
                            name: 'Hospital',
                        },
                    },
                ]),
            });

            const result = await fetchAssetsByType(mockAssetTypeId, iconMap);

            expect(result[0].styles.faIcon).toBeUndefined();
            expect(result[0].styles.iconFallbackText).toBe('?');
        });

        it('handles multiple assets', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue([
                    {
                        id: 'asset-7',
                        name: 'Test Asset 7',
                        geom: 'SRID=4326;POINT (-1.4 50.67)',
                        type: {
                            id: mockAssetTypeId,
                            name: 'Hospital',
                        },
                    },
                    {
                        id: 'asset-8',
                        name: 'Test Asset 8',
                        geom: 'SRID=4326;POINT (-1.5 50.77)',
                        type: {
                            id: mockAssetTypeId,
                            name: 'Hospital',
                        },
                    },
                ]),
            });

            const result = await fetchAssetsByType(mockAssetTypeId);

            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('asset-7');
            expect(result[1].id).toBe('asset-8');
        });

        it('throws error when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
            });

            await expect(fetchAssetsByType(mockAssetTypeId)).rejects.toThrow(`Failed to retrieve assets for type ${mockAssetTypeId}: Internal Server Error`);
        });

        it('throws error on network failure', async () => {
            fetchMock.mockRejectedValue(new Error('Network error'));

            await expect(fetchAssetsByType(mockAssetTypeId)).rejects.toThrow('Network error');
        });

        it('handles empty response', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue([]),
            });

            const result = await fetchAssetsByType(mockAssetTypeId);

            expect(result).toHaveLength(0);
        });

        it('creates assets with correct default styles', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue([
                    {
                        id: 'asset-9',
                        name: 'Test Asset 9',
                        geom: 'SRID=4326;POINT (-1.4 50.67)',
                        type: {
                            id: mockAssetTypeId,
                            name: 'Hospital',
                        },
                    },
                ]),
            });

            const result = await fetchAssetsByType(mockAssetTypeId);

            expect(result[0].styles.classUri).toBe(mockAssetTypeId);
            expect(result[0].styles.color).toBe('#DDDDDD');
            expect(result[0].styles.backgroundColor).toBe('#121212');
            expect(result[0].styles.alt).toBe('Hospital');
        });
    });
});
