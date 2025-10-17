import { Feature, Point } from 'geojson';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Link, OsNgdDataSourceHandler } from './os-ngd-data-source-handler';
import { AssetSpecification } from '@/hooks/queries/dataset-utils';

globalThis.fetch = vi.fn() as any;

function mockFetch(obj: any) {
    (fetch as any).mockImplementationOnce(() =>
        Promise.resolve({
            ok: true,
            json: vi.fn().mockResolvedValue(obj),
        }),
    );
}

beforeEach(() => {
    vi.resetAllMocks();
});

describe('buildUrlsForDataSource', () => {
    const handler = new OsNgdDataSourceHandler('test-locator');

    it('returns the correct URL without filters', () => {
        const assetSpecification = {
            collection: 'Test',
            expectedCount: 5,
        } as AssetSpecification;
        const urls = handler.buildUrlsForDataSource(assetSpecification);
        expect(urls).toHaveLength(1);
        expect(urls[0]).toBe('/transparent-proxy/os-ngd/features/ngd/ofa/v1/collections/Test/items?bbox=test-locator&offset=000');
    });

    it('returns the correct URL with filters', () => {
        const assetSpecification = {
            collection: 'Test',
            description: ['first desc', 'second desc'],
        } as AssetSpecification;
        const urls = handler.buildUrlsForDataSource(assetSpecification);
        expect(urls).toHaveLength(2);
        expect(urls).toEqual([
            "/transparent-proxy/os-ngd/features/ngd/ofa/v1/collections/Test/items?bbox=test-locator&filter=description='first%20desc'",
            "/transparent-proxy/os-ngd/features/ngd/ofa/v1/collections/Test/items?bbox=test-locator&filter=description='second%20desc'",
        ]);
    });

    it('builds urls for known pages', async () => {
        const assetSpecification = {
            collection: 'Test',
            description: ['test_description'],
            expectedCount: 240,
        } as AssetSpecification;
        const urls = handler.buildUrlsForDataSource(assetSpecification);
        expect(urls).toHaveLength(3);
        expect(urls).toEqual([
            "/transparent-proxy/os-ngd/features/ngd/ofa/v1/collections/Test/items?bbox=test-locator&filter=description='test_description'&offset=000",
            "/transparent-proxy/os-ngd/features/ngd/ofa/v1/collections/Test/items?bbox=test-locator&filter=description='test_description'&offset=100",
            "/transparent-proxy/os-ngd/features/ngd/ofa/v1/collections/Test/items?bbox=test-locator&filter=description='test_description'&offset=200",
        ]);
    });
});

describe('fetchDataForAssetSpecification', () => {
    const handler = new OsNgdDataSourceHandler('test-locator');

    const featureId = '99af3e40-aae5-40cd-9bb4-3aeef3b30269';
    const name = 'Name of place';
    const response = {
        links: [] as Link[],
        features: [
            {
                id: featureId,
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [[[1, 2]]],
                },
                properties: {
                    name1_text: name,
                },
            },
        ],
        numberReturned: 5,
    };

    it('returns correct feature from one data point', async () => {
        mockFetch(response);

        const result = (await handler.fetchDataForAssetSpecification({} as AssetSpecification, 'test-url')) as Feature<Point>[];

        expect(fetch).toHaveBeenCalledWith('test-url');
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(featureId);
        expect(result[0].type).toBe('Feature');
        expect(result[0].geometry.coordinates).toStrictEqual([[[1, 2]]]);
        expect(result[0].properties?.name).toBe(name);
    });

    it('handles multiple pages when no offset in URL', async () => {
        response.links = [
            {
                href: 'test&key=test',
                rel: 'next',
            },
        ];
        
        
        mockFetch(structuredClone(response));
        response.links = [];
        mockFetch(structuredClone(response));

        const result = (await handler.fetchDataForAssetSpecification({} as AssetSpecification, 'first')) as Feature<Point>[];

        expect(result).toHaveLength(2);
        expect(fetch).toHaveBeenCalledTimes(2);
        expect(fetch).toHaveBeenCalledWith('first');
        expect(fetch).toHaveBeenCalledWith('test');
    });

    it('does not paginate when offset in URL and less than expected count on middle page', async () => {
        const url = '&offset=100';
        response.links = [
            {
                href: 'test&key=test',
                rel: 'next',
            },
        ];
        mockFetch(structuredClone(response));

        await handler.fetchDataForAssetSpecification({ expectedCount: 330 } as AssetSpecification, url);

        expect(fetch).toHaveBeenCalledWith(url);
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('does not paginate when offset in URL and less than expected count on last page', async () => {
        const url = '&offset=100';
        response.links = [
            {
                href: 'test&key=test',
                rel: 'next',
            },
        ];
        
        
        mockFetch(structuredClone(response));
        response.links = [];
        mockFetch(structuredClone(response));

        await handler.fetchDataForAssetSpecification({ expectedCount: 125 } as AssetSpecification, url);

        expect(fetch).toHaveBeenCalledWith(url);
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('handles multiple pages when offset in URL and number returned on last page is greater than expected', async () => {
        const url = '&offset=100';
        response.links = [
            {
                href: 'test&key=test',
                rel: 'next',
            },
        ];
        response.numberReturned = 100;

        
        
        mockFetch(structuredClone(response));
        response.links = [];
        response.numberReturned = 25;
        mockFetch(structuredClone(response));

        await handler.fetchDataForAssetSpecification({ expectedCount: 190 } as AssetSpecification, url);

        expect(fetch).toHaveBeenCalledTimes(2);
        expect(fetch).toHaveBeenCalledWith(url);
        expect(fetch).toHaveBeenCalledWith('test');
    });
});
