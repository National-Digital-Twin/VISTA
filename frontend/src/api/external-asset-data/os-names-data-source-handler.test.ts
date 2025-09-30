import { Feature, Point } from 'geojson';
import { OsNamesDataSourceHandler } from './os-names-data-source-handler';
import { AssetSpecification } from '@/hooks/queries/dataset-utils';

globalThis.fetch = jest.fn();

function mockFetch(obj: any) {
    (fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
            ok: true,
            json: jest.fn().mockResolvedValue(obj),
        }),
    );
}

describe('buildUrlsForDataSource', () => {
    const handler = new OsNamesDataSourceHandler('test-locator');

    it('returns the correct URL with local type filter', () => {
        const assetSpecification = {
            description: ['First_Type'],
        } as AssetSpecification;
        const urls = handler.buildUrlsForDataSource(assetSpecification);
        expect(urls).toHaveLength(1);
        expect(urls).toEqual(['/transparent-proxy/os-names/search/names/v1/find?query=Wight&fq=BBOX:test-locator&fq=LOCAL_TYPE:First_Type']);
    });
});

describe('fetchDataForAssetSpecification', () => {
    const handler = new OsNamesDataSourceHandler('test-locator');

    const featureId = 'osgb1000000011111111';
    const name = 'Place X';
    const data = {
        ID: featureId,
        NAME1: name,
        NAME2: undefined as unknown,
        GEOMETRY_X: 429157,
        GEOMETRY_Y: 623009,
    };

    const response: { results: any[] | undefined } = {
        results: [
            {
                GAZETTEER_ENTRY: data,
            },
        ],
    };

    it('returns correct feature from one data point', async () => {
        mockFetch(response);

        const result = (await handler.fetchDataForAssetSpecification({} as AssetSpecification, '')) as Feature<Point>[];

        expect(fetch).toHaveBeenCalledWith('');
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(featureId);
        expect(result[0].type).toBe('Feature');
        expect(result[0].geometry.coordinates).toStrictEqual([-1.5400079624974126, 55.499999613061284]);
        expect(result[0].properties?.name).toBe(name);
    });

    it('returns `NAME2` when given as name', async () => {
        const primary_name = 'Place Y';
        data.NAME2 = primary_name;
        response.results = [{ GAZETTEER_ENTRY: data }];
        mockFetch(response);

        const result = (await handler.fetchDataForAssetSpecification({} as AssetSpecification, '')) as Feature<Point>[];

        expect(result[0].properties?.name).toBe(primary_name);
    });

    it('handles an empty response', async () => {
        response.results = undefined;
        mockFetch(response);

        const result = (await handler.fetchDataForAssetSpecification({} as AssetSpecification, '')) as Feature<Point>[];

        expect(result).toHaveLength(0);
    });
});
