import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchScenarioAssetTypes, toggleAssetTypeVisibility, clearAllAssetTypeVisibility } from './scenario-asset-types';

vi.mock('@/config/app-config', () => ({
    default: {
        services: {
            apiBaseUrl: '/ndtp-python/api',
        },
    },
}));

describe('scenario-asset-types API', () => {
    const mockFetch = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        globalThis.fetch = mockFetch;
    });

    describe('fetchScenarioAssetTypes', () => {
        it('fetches asset types for map-wide visibility', async () => {
            const mockData = [
                {
                    id: 'cat-1',
                    name: 'Healthcare',
                    subCategories: [
                        {
                            id: 'subcat-1',
                            name: 'Hospitals',
                            assetTypes: [{ id: 'type-1', name: 'Hospital', isActive: true }],
                        },
                    ],
                },
            ];

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockData),
            });

            const result = await fetchScenarioAssetTypes('scenario-123');

            expect(mockFetch).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-123/asset-types/', { headers: { 'Content-Type': 'application/json' } });
            expect(result).toEqual(mockData);
        });

        it('fetches asset types for specific focus area', async () => {
            const mockData = [{ id: 'cat-1', name: 'Healthcare', subCategories: [] }];

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockData),
            });

            const result = await fetchScenarioAssetTypes('scenario-123', 'focus-area-456');

            expect(mockFetch).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-123/asset-types/?focus_area_id=focus-area-456', {
                headers: { 'Content-Type': 'application/json' },
            });
            expect(result).toEqual(mockData);
        });

        it('throws error when request fails', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                statusText: 'Not Found',
            });

            await expect(fetchScenarioAssetTypes('scenario-123')).rejects.toThrow('Failed to fetch scenario asset types: Not Found');
        });
    });

    describe('toggleAssetTypeVisibility', () => {
        it('toggles visibility for map-wide asset type', async () => {
            const mockResponse = {
                assetTypeId: 'type-1',
                focusAreaId: null,
                isActive: true,
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await toggleAssetTypeVisibility('scenario-123', {
                assetTypeId: 'type-1',
                focusAreaId: null,
                isActive: true,
            });

            expect(mockFetch).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-123/visible-asset-types/', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assetTypeId: 'type-1',
                    focusAreaId: null,
                    isActive: true,
                }),
            });
            expect(result).toEqual({
                assetTypeId: 'type-1',
                focusAreaId: null,
                isActive: true,
            });
        });

        it('toggles visibility for focus area specific asset type', async () => {
            const mockResponse = {
                assetTypeId: 'type-1',
                focusAreaId: 'focus-area-456',
                isActive: false,
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await toggleAssetTypeVisibility('scenario-123', {
                assetTypeId: 'type-1',
                focusAreaId: 'focus-area-456',
                isActive: false,
            });

            expect(mockFetch).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-123/visible-asset-types/', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assetTypeId: 'type-1',
                    focusAreaId: 'focus-area-456',
                    isActive: false,
                }),
            });
            expect(result).toEqual({
                assetTypeId: 'type-1',
                focusAreaId: 'focus-area-456',
                isActive: false,
            });
        });

        it('throws error when toggle request fails', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                statusText: 'Bad Request',
            });

            await expect(
                toggleAssetTypeVisibility('scenario-123', {
                    assetTypeId: 'type-1',
                    isActive: true,
                }),
            ).rejects.toThrow('Failed to toggle asset type visibility: Bad Request');
        });

        it('handles undefined focusAreaId as null', async () => {
            const mockResponse = {
                assetTypeId: 'type-1',
                focusAreaId: null,
                isActive: true,
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            await toggleAssetTypeVisibility('scenario-123', {
                assetTypeId: 'type-1',
                isActive: true,
            });

            expect(mockFetch).toHaveBeenCalledWith(
                '/ndtp-python/api/scenarios/scenario-123/visible-asset-types/',
                expect.objectContaining({
                    body: JSON.stringify({
                        assetTypeId: 'type-1',
                        focusAreaId: null,
                        isActive: true,
                    }),
                }),
            );
        });
    });

    describe('clearAllAssetTypeVisibility', () => {
        it('clears all visibility for map-wide', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({}),
            });

            await clearAllAssetTypeVisibility('scenario-123');

            expect(mockFetch).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-123/visible-asset-types/', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });
        });

        it('clears all visibility for specific focus area', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({}),
            });

            await clearAllAssetTypeVisibility('scenario-123', 'focus-area-456');

            expect(mockFetch).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-123/visible-asset-types/?focus_area_id=focus-area-456', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });
        });

        it('throws error when clear request fails', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                statusText: 'Server Error',
            });

            await expect(clearAllAssetTypeVisibility('scenario-123')).rejects.toThrow('Failed to clear asset type visibility: Server Error');
        });
    });
});
