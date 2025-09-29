import { Feature } from 'geojson';
import { DataSourceHandler } from './data-source-handler';

global.fetch = jest.fn();

class TestDataSourceHandler extends DataSourceHandler {
    buildUrlsForDataSource() {
        return [];
    }

    async fetchDataForAssetSpecification() {
        return [];
    }
}

describe('isMatchForAssetSpecificationFilters', () => {
    const handler = new TestDataSourceHandler('test-locator');

    const makeFeature = (properties: Record<string, any>): Feature => ({
        type: 'Feature',
        properties,
        geometry: {
            type: 'Point',
            coordinates: [0, 0],
        },
    });

    it('returns true when all filters match', () => {
        const assetSpec = {
            filters: [
                { filterName: 'type', filterValue: 'bike' },
                { filterName: 'status', filterValue: 'active' },
            ],
        };

        const feature = makeFeature({ type: 'bike', status: 'active' });

        expect(
            // @ts-expect-error: calling protected method for test
            handler.isMatchForAssetSpecificationFilters(assetSpec, feature),
        ).toBe(true);
    });

    it('returns false when not all filters match', () => {
        const assetSpec = {
            filters: [
                { filterName: 'type', filterValue: 'bike' },
                { filterName: 'status', filterValue: 'active' },
            ],
        };

        const feature = makeFeature({ type: 'bike', status: 'inactive' });

        expect(
            // @ts-expect-error: calling protected method for test
            handler.isMatchForAssetSpecificationFilters(assetSpec, feature),
        ).toBe(false);
    });

    it('returns true when no filters are defined', () => {
        const assetSpec = {};
        const feature = makeFeature({ any: 'value' });

        expect(
            // @ts-expect-error: calling protected method for test
            handler.isMatchForAssetSpecificationFilters(assetSpec, feature),
        ).toBe(true);
    });
});
