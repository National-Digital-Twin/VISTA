import { Feature, Point } from 'geojson';
import { describe, it, expect, vi } from 'vitest';
import Papa from 'papaparse';
import { NaptanDataSourceHandler } from './naptan-data-source-handler';
import { AssetSpecification } from '@/hooks/queries/dataset-utils';

globalThis.fetch = vi.fn() as any;
vi.mock('papaparse', () => ({
    default: {
        parse: vi.fn(),
    },
}));

describe('buildUrlsForDataSource', () => {
    const handler = new NaptanDataSourceHandler('test-locator');

    it('returns the correct URL', () => {
        const urls = handler.buildUrlsForDataSource({} as AssetSpecification);
        expect(urls).toHaveLength(1);
        expect(urls[0]).toBe('/transparent-proxy/naptan/v1/access-nodes?dataFormat=csv&atcoAreaCodes=test-locator');
    });
});

describe('fetchDataForAssetSpecification', () => {
    const handler = new NaptanDataSourceHandler('test-locator');

    (fetch as any).mockResolvedValue({
        text: vi.fn().mockResolvedValue(''),
    });

    it('returns correct feature from data point', async () => {
        const mockStops = [
            { Longitude: 1, Latitude: 2, ATCOCode: 'test1', CommonName: 'abc' },
            { Longitude: 3, Latitude: 4, ATCOCode: 'test2', CommonName: 'def' },
        ];
        (Papa.parse as any).mockReturnValue({
            data: mockStops,
        });

        const result = (await handler.fetchDataForAssetSpecification({} as AssetSpecification, '')) as Feature<Point>[];

        expect(result).toHaveLength(2);
        expect(result[0].id).toBe('test1');
        expect(result[1].id).toBe('test2');
        expect(result[0].geometry.type).toBe('Point');
        expect(result[1].geometry.type).toBe('Point');
        expect(result[0].geometry.coordinates).toStrictEqual([1, 2]);
        expect(result[1].geometry.coordinates).toStrictEqual([3, 4]);
        expect(result[0].properties?.name).toBe('abc');
        expect(result[1].properties?.name).toBe('def');
    });

    it('merges assets at the same location with the same name', async () => {
        const mockStops = [
            { Longitude: 1, Latitude: 2, ATCOCode: 'test1', CommonName: 'abc' },
            { Longitude: 1, Latitude: 2, ATCOCode: 'test2', CommonName: 'abc' },
        ];
        (Papa.parse as any).mockReturnValue({
            data: mockStops,
        });

        const result = (await handler.fetchDataForAssetSpecification({} as AssetSpecification, '')) as Feature<Point>[];
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('test1');
        expect(result[0].geometry.type).toBe('Point');
        expect(result[0].geometry.coordinates).toStrictEqual([1, 2]);
        expect(result[0].properties?.name).toBe('abc');
    });
});
