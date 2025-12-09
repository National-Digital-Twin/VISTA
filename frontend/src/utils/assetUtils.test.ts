import { describe, it, expect } from 'vitest';
import { createLinearFeature, createPointFeature, formatAssetDetails, getLinearGeometry } from './assetUtils';
import type { Asset } from '@/api/assets-by-type';

const baseAsset: Asset = {
    id: 'asset-1',
    type: 'type-1',
    name: 'Test Asset',
    lat: 10,
    lng: 20,
    geometry: {
        type: 'Point',
        coordinates: [20, 10],
    },
    dependent: { criticalitySum: 5 },
    styles: {
        classUri: 'type-1',
        color: '#fff',
        backgroundColor: '#000',
        iconFallbackText: 'TA',
        alt: 'Test Asset',
    },
    elementType: 'asset',
};

describe('assetUtils', () => {
    describe('createPointFeature', () => {
        it('returns null when lat or lng is missing', () => {
            const assetMissingLat: Asset = { ...baseAsset, lat: undefined };
            expect(createPointFeature(assetMissingLat)).toBeNull();
        });

        it('creates a point feature with id, criticality, and type', () => {
            const feature = createPointFeature(baseAsset);
            expect(feature).not.toBeNull();
            expect(feature?.geometry).toEqual({
                type: 'Point',
                coordinates: [20, 10],
            });
            expect(feature?.properties).toMatchObject({
                id: 'asset-1',
                criticality: 5,
                type: 'type-1',
            });
        });
    });

    describe('getLinearGeometry', () => {
        it('returns LineString geometry unchanged', () => {
            const line = getLinearGeometry({
                type: 'LineString',
                coordinates: [
                    [0, 0],
                    [1, 1],
                ],
            });
            expect(line.type).toBe('LineString');
        });

        it('returns MultiLineString geometry unchanged', () => {
            const multi = getLinearGeometry({
                type: 'MultiLineString',
                coordinates: [
                    [
                        [0, 0],
                        [1, 1],
                    ],
                ],
            });
            expect(multi.type).toBe('MultiLineString');
        });

        it('passes through non-linear geometry', () => {
            const geometry = { type: 'Polygon', coordinates: [] };
            expect(getLinearGeometry(geometry as any)).toBe(geometry);
        });
    });

    describe('createLinearFeature', () => {
        const lineAsset: Asset = {
            ...baseAsset,
            geometry: {
                type: 'LineString',
                coordinates: [
                    [0, 0],
                    [1, 1],
                ],
            },
        };

        it('returns null for non-linear geometry', () => {
            expect(createLinearFeature(baseAsset, [])).toBeNull();
        });

        it('creates a linear feature with defaults when not selected', () => {
            const feature = createLinearFeature(lineAsset, []);
            expect(feature).not.toBeNull();
            expect(feature?.properties).toMatchObject({
                id: 'asset-1',
                criticality: 5,
                lineColor: '#00AA00',
                lineWidth: 3,
                selected: false,
            });
        });

        it('marks feature as selected and applies custom color', () => {
            const feature = createLinearFeature(lineAsset, [{ id: 'asset-1' } as any], '#123456');
            expect(feature?.properties).toMatchObject({
                selected: true,
                lineWidth: 4,
                lineColor: '#123456',
            });
        });
    });

    describe('formatAssetDetails', () => {
        it('prefers assetInfo name, then asset name, then id', () => {
            const withInfo = formatAssetDetails(baseAsset, { name: 'Info Name', assetType: 'info-type' });
            expect(withInfo.title).toBe('Info Name');
            expect(withInfo.type).toBe('info-type');

            const withAssetName = formatAssetDetails({ ...baseAsset, name: 'Asset Name' }, { name: '   ' });
            expect(withAssetName.title).toBe('Asset Name');

            const withIdFallback = formatAssetDetails({ ...baseAsset, name: '' }, { name: '' });
            expect(withIdFallback.title).toBe('asset-1');
        });

        it('selects description from assetInfo or asset', () => {
            const fromInfo = formatAssetDetails(baseAsset, { desc: 'Info desc' });
            expect(fromInfo.desc).toBe('Info desc');

            const fromAsset = formatAssetDetails({ ...baseAsset, description: 'Asset desc' });
            expect(fromAsset.desc).toBe('Asset desc');
        });

        it('passes through criticality and optional color', () => {
            const details = formatAssetDetails(baseAsset, undefined, '#ff00ff');
            expect(details.criticality).toBe(5);
            expect(details.criticalityColor).toBe('#ff00ff');
        });
    });
});
