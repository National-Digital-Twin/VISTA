import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import useAssetsInPolygons from './useAssetsInPolygons';
import useGroupedAssets from './queries/useGroupedAssets';

const mockAssets = [
    { lng: 0.5, lat: 0.5, uri: 'asset1' },
    { lng: 1.5, lat: 1.5, uri: 'asset2' },
];

const createPolygonFeature = (
    coordinates: number[][][] = [
        [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
        ],
    ],
) => ({
    type: 'Feature',
    geometry: {
        type: 'Polygon',
        coordinates,
    },
    properties: {},
});

const createMockUseGroupedAssets = () => ({
    isLoadingAssets: false,
    assets: mockAssets,
});

vi.mock('./queries/useGroupedAssets', () => ({
    default: vi.fn(),
}));

vi.mock('@/models', () => ({
    Asset: class MockAsset {
        constructor(public data: any) {}
        lng?: number;
        lat?: number;
        hasGeometry() {
            return false;
        }
        createSegmentCoords() {
            return [];
        }
    },
}));

describe('useAssetsInPolygons', () => {
    let mockUseGroupedAssets: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseGroupedAssets = vi.mocked(useGroupedAssets);
    });

    describe('when assets are loading', () => {
        it('returns empty array when assets are loading', () => {
            mockUseGroupedAssets.mockReturnValue({
                isLoadingAssets: true,
                assets: [],
            });

            const { result } = renderHook(() => useAssetsInPolygons());

            const polygonFeatures = [createPolygonFeature()];

            const foundAssets = result.current.findAssetsInPolygons({ polygons: polygonFeatures });

            expect(foundAssets).toEqual([]);
        });
    });

    describe('when assets are loaded', () => {
        it('finds assets with point coordinates in polygons', () => {
            mockUseGroupedAssets.mockReturnValue({
                isLoadingAssets: false,
                assets: [
                    { lng: 0.5, lat: 0.5, uri: 'asset1' },
                    { lng: 1.5, lat: 1.5, uri: 'asset2' },
                ],
            });

            const { result } = renderHook(() => useAssetsInPolygons());

            const polygonFeatures = [createPolygonFeature()];

            const foundAssets = result.current.findAssetsInPolygons({ polygons: polygonFeatures });

            expect(foundAssets).toHaveLength(1);
            expect(foundAssets[0].uri).toBe('asset1');
        });

        it('returns empty array when no assets match polygons', () => {
            mockUseGroupedAssets.mockReturnValue({
                isLoadingAssets: false,
                assets: [
                    { lng: 1.5, lat: 1.5, uri: 'asset1' },
                    { lng: 2.5, lat: 2.5, uri: 'asset2' },
                ],
            });

            const { result } = renderHook(() => useAssetsInPolygons());

            const polygonFeatures = [createPolygonFeature()];

            const foundAssets = result.current.findAssetsInPolygons({ polygons: polygonFeatures });

            expect(foundAssets).toEqual([]);
        });

        it('handles assets without coordinates', () => {
            mockUseGroupedAssets.mockReturnValue({
                isLoadingAssets: false,
                assets: [
                    { uri: 'asset1' }, // No lng/lat
                    { lng: 0.5, lat: 0.5, uri: 'asset2' },
                ],
            });

            const { result } = renderHook(() => useAssetsInPolygons());

            const polygonFeatures = [createPolygonFeature()];

            const foundAssets = result.current.findAssetsInPolygons({ polygons: polygonFeatures });

            expect(foundAssets).toHaveLength(1);
            expect(foundAssets[0].uri).toBe('asset2');
        });

        it('handles empty polygon array', () => {
            mockUseGroupedAssets.mockReturnValue(createMockUseGroupedAssets());

            const { result } = renderHook(() => useAssetsInPolygons());

            const foundAssets = result.current.findAssetsInPolygons({ polygons: [] });

            expect(foundAssets).toEqual([]);
        });

        it('handles empty assets array', () => {
            mockUseGroupedAssets.mockReturnValue({
                isLoadingAssets: false,
                assets: [],
            });

            const { result } = renderHook(() => useAssetsInPolygons());

            const polygonFeatures = [createPolygonFeature()];

            const foundAssets = result.current.findAssetsInPolygons({ polygons: polygonFeatures });

            expect(foundAssets).toEqual([]);
        });
    });

    describe('callback memoization', () => {
        it('memoizes findAssetsInPolygons callback', () => {
            mockUseGroupedAssets.mockReturnValue(createMockUseGroupedAssets());

            const { result, rerender } = renderHook(() => useAssetsInPolygons());

            const firstCallback = result.current.findAssetsInPolygons;

            rerender();

            expect(result.current.findAssetsInPolygons).toBe(firstCallback);
        });
    });
});
