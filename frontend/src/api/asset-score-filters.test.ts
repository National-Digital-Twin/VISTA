import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    fetchAssetScoreFilters,
    putAssetScoreFilter,
    deleteAssetScoreFilter,
    type AssetScoreFilter,
    type CreateUpdateScoreFilterRequest,
} from './asset-score-filters';

vi.mock('@/config/app-config', () => ({
    default: {
        services: {
            apiBaseUrl: '/ndtp-python/api',
        },
    },
}));

describe('asset-score-filters API', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    const mockScoreFilter: AssetScoreFilter = {
        id: 'filter-123',
        focusAreaId: 'fa-123',
        assetTypeId: 'asset-type-456',
        criticalityValues: [1, 2, 3],
        exposureValues: [0, 1, 2],
        redundancyValues: [2, 3],
        dependencyMin: '0.5',
        dependencyMax: '2.5',
    };

    beforeEach(() => {
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as any;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('fetchAssetScoreFilters', () => {
        it('successfully fetches asset score filters from API', async () => {
            const mockFilters: AssetScoreFilter[] = [mockScoreFilter, { ...mockScoreFilter, id: 'filter-456', assetTypeId: null }];

            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue(mockFilters),
            });

            const result = await fetchAssetScoreFilters('scenario-123');

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-123/asset-score-filters/', {
                headers: { 'Content-Type': 'application/json' },
            });
            expect(result).toEqual(mockFilters);
            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('filter-123');
        });

        it('throws error when API call fails', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                statusText: 'Not Found',
            });

            await expect(fetchAssetScoreFilters('scenario-123')).rejects.toThrow('Failed to fetch asset score filters: Not Found');
        });

        it('handles empty filters array', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue([]),
            });

            const result = await fetchAssetScoreFilters('scenario-123');

            expect(result).toEqual([]);
        });

        it('throws error on network failure', async () => {
            fetchMock.mockRejectedValueOnce(new Error('Network error'));

            await expect(fetchAssetScoreFilters('scenario-123')).rejects.toThrow('Network error');
        });
    });

    describe('putAssetScoreFilter', () => {
        it('successfully creates/updates a score filter', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue(mockScoreFilter),
            });

            const request: CreateUpdateScoreFilterRequest = {
                focusAreaId: 'fa-123',
                assetTypeId: 'asset-type-456',
                criticalityValues: [1, 2, 3],
                exposureValues: [0, 1, 2],
                redundancyValues: [2, 3],
                dependencyMin: '0.5',
                dependencyMax: '2.5',
            };

            const result = await putAssetScoreFilter('scenario-123', request);

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-123/asset-score-filters/', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request),
            });
            expect(result).toEqual(mockScoreFilter);
        });

        it('handles null values in request', async () => {
            const filterWithNulls: AssetScoreFilter = {
                ...mockScoreFilter,
                criticalityValues: null,
                exposureValues: null,
                redundancyValues: null,
                dependencyMin: null,
                dependencyMax: null,
            };

            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue(filterWithNulls),
            });

            const request: CreateUpdateScoreFilterRequest = {
                focusAreaId: 'fa-123',
                assetTypeId: null,
                criticalityValues: null,
                exposureValues: null,
                redundancyValues: null,
                dependencyMin: null,
                dependencyMax: null,
            };

            const result = await putAssetScoreFilter('scenario-123', request);

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-123/asset-score-filters/', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request),
            });
            expect(result.criticalityValues).toBeNull();
        });

        it('throws error when API call fails', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                statusText: 'Bad Request',
            });

            const request: CreateUpdateScoreFilterRequest = {
                focusAreaId: 'fa-123',
                assetTypeId: 'asset-type-456',
                criticalityValues: [1, 2, 3],
                exposureValues: null,
                redundancyValues: null,
                dependencyMin: null,
                dependencyMax: null,
            };

            await expect(putAssetScoreFilter('scenario-123', request)).rejects.toThrow('Failed to save asset score filter: Bad Request');
        });

        it('throws error on network failure', async () => {
            fetchMock.mockRejectedValueOnce(new Error('Network error'));

            const request: CreateUpdateScoreFilterRequest = {
                focusAreaId: 'fa-123',
                assetTypeId: 'asset-type-456',
                criticalityValues: null,
                exposureValues: null,
                redundancyValues: null,
                dependencyMin: null,
                dependencyMax: null,
            };

            await expect(putAssetScoreFilter('scenario-123', request)).rejects.toThrow('Network error');
        });
    });

    describe('deleteAssetScoreFilter', () => {
        it('successfully deletes a score filter with focusAreaId and assetTypeId', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
            });

            await deleteAssetScoreFilter('scenario-123', 'fa-123', 'asset-type-456');

            expect(fetchMock).toHaveBeenCalledWith(
                '/ndtp-python/api/scenarios/scenario-123/asset-score-filters/?focus_area_id=fa-123&asset_type_id=asset-type-456',
                {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                },
            );
        });

        it('successfully deletes a score filter with only focusAreaId', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
            });

            await deleteAssetScoreFilter('scenario-123', 'fa-123', null);

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-123/asset-score-filters/?focus_area_id=fa-123', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });
        });

        it('successfully deletes a score filter with only assetTypeId', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
            });

            await deleteAssetScoreFilter('scenario-123', null, 'asset-type-456');

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-123/asset-score-filters/?asset_type_id=asset-type-456', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });
        });

        it('successfully deletes a score filter with no focusAreaId or assetTypeId', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
            });

            await deleteAssetScoreFilter('scenario-123', null, null);

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-123/asset-score-filters/?', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });
        });

        it('throws error when API call fails', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                statusText: 'Not Found',
            });

            await expect(deleteAssetScoreFilter('scenario-123', 'fa-123', 'asset-type-456')).rejects.toThrow('Failed to delete asset score filter: Not Found');
        });

        it('throws error on network failure', async () => {
            fetchMock.mockRejectedValueOnce(new Error('Network error'));

            await expect(deleteAssetScoreFilter('scenario-123', 'fa-123', 'asset-type-456')).rejects.toThrow('Network error');
        });
    });
});
