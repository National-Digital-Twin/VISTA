import { Feature } from 'geojson';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DataSourceHandler } from './data-source-handler';

class TestDataSourceHandler extends DataSourceHandler {
    buildUrlsForDataSource() {
        return [];
    }

    async fetchDataForAssetSpecification() {
        return [];
    }
}

const createFeature = (properties: Record<string, any>): Feature => ({
    type: 'Feature',
    properties,
    geometry: { type: 'Point', coordinates: [0, 0] },
});

describe('DataSourceHandler', () => {
    let handler: TestDataSourceHandler;
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        handler = new TestDataSourceHandler('test-locator');
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as any;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('isMatchForAssetSpecificationFilters', () => {
        it('returns true when all filters match', () => {
            const assetSpec = {
                filters: [
                    { filterName: 'type', filterValue: 'bike' },
                    { filterName: 'status', filterValue: 'active' },
                ],
            };
            const feature = createFeature({ type: 'bike', status: 'active' });

            expect(
                // @ts-expect-error
                handler.isMatchForAssetSpecificationFilters(assetSpec, feature),
            ).toBe(true);
        });

        it('returns false when one filter does not match', () => {
            const assetSpec = {
                filters: [
                    { filterName: 'type', filterValue: 'bike' },
                    { filterName: 'status', filterValue: 'active' },
                ],
            };
            const feature = createFeature({ type: 'bike', status: 'inactive' });

            expect(
                // @ts-expect-error
                handler.isMatchForAssetSpecificationFilters(assetSpec, feature),
            ).toBe(false);
        });

        it('returns true when no filters are defined', () => {
            const assetSpec = {};
            const feature = createFeature({ any: 'value' });

            expect(
                // @ts-expect-error
                handler.isMatchForAssetSpecificationFilters(assetSpec, feature),
            ).toBe(true);
        });

        it('returns true when filter matches any value in array', () => {
            const assetSpec = {
                filters: [{ filterName: 'type', filterValue: ['bike', 'scooter', 'car'] }],
            };
            const feature = createFeature({ type: 'scooter' });

            expect(
                // @ts-expect-error
                handler.isMatchForAssetSpecificationFilters(assetSpec, feature),
            ).toBe(true);
        });

        it('returns false when filter does not match any value in array', () => {
            const assetSpec = {
                filters: [{ filterName: 'type', filterValue: ['bike', 'scooter'] }],
            };
            const feature = createFeature({ type: 'car' });

            expect(
                // @ts-expect-error
                handler.isMatchForAssetSpecificationFilters(assetSpec, feature),
            ).toBe(false);
        });

        it('returns false when feature has no properties', () => {
            const assetSpec = {
                filters: [{ filterName: 'type', filterValue: 'bike' }],
            };
            const feature = { ...createFeature({}), properties: null };

            expect(
                // @ts-expect-error
                handler.isMatchForAssetSpecificationFilters(assetSpec, feature),
            ).toBe(false);
        });
    });

    describe('fetchFromUrl', () => {
        it('successfully fetches and parses JSON response', async () => {
            const mockData = { data: 'test' };
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockData),
            });

            const result = await handler.fetchFromUrl('https://api.test.com/data');

            expect(result).toEqual(mockData);
            expect(fetchMock).toHaveBeenCalledWith('https://api.test.com/data');
        });

        it('throws error when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 404,
            });

            await expect(handler.fetchFromUrl('https://api.test.com/data')).rejects.toThrow(
                'An error occured while retrieving data from URL https://api.test.com/data',
            );
        });

        it('throws error when fetch fails', async () => {
            fetchMock.mockRejectedValue(new Error('Network error'));

            await expect(handler.fetchFromUrl('https://api.test.com/data')).rejects.toThrow('Network error');
        });
    });

    describe('fetchFromUrlWithRetry', () => {
        it('successfully fetches on first attempt', async () => {
            const mockData = { data: 'test' };
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockData),
            });

            const result = await handler.fetchFromUrlWithRetry('https://api.test.com/data');

            expect(result).toEqual(mockData);
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it('retries on failure and succeeds', async () => {
            const mockData = { data: 'test' };
            fetchMock
                .mockRejectedValueOnce(new Error('Network error'))
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce({
                    ok: true,
                    json: vi.fn().mockResolvedValue(mockData),
                });

            const result = await handler.fetchFromUrlWithRetry('https://api.test.com/data', 5, 10);

            expect(result).toEqual(mockData);
            expect(fetchMock).toHaveBeenCalledTimes(3);
        });

        it('throws error after all retries exhausted', async () => {
            fetchMock.mockRejectedValue(new Error('Network error'));

            await expect(handler.fetchFromUrlWithRetry('https://api.test.com/data', 2, 10)).rejects.toThrow(
                'Failed to fetch https://api.test.com/data after 3 attempts',
            );
            expect(fetchMock).toHaveBeenCalledTimes(3);
        });

        it('retries on HTTP error response', async () => {
            const mockData = { data: 'test' };
            fetchMock
                .mockResolvedValueOnce({ ok: false, status: 500 })
                .mockResolvedValueOnce({ ok: false, status: 503 })
                .mockResolvedValueOnce({
                    ok: true,
                    json: vi.fn().mockResolvedValue(mockData),
                });

            const result = await handler.fetchFromUrlWithRetry('https://api.test.com/data', 5, 10);

            expect(result).toEqual(mockData);
            expect(fetchMock).toHaveBeenCalledTimes(3);
        });
    });
});
