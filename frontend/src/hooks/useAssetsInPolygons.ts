import { useCallback } from 'react';
import { booleanPointInPolygon, booleanIntersects, multiLineString } from '@turf/turf';
import { Feature, Polygon } from 'geojson';
import useGroupedAssets from './queries/useGroupedAssets';
import { Asset } from '@/models';

export default function useAssetsInPolygons() {
    const { assets, isLoadingAssets } = useGroupedAssets({});

    const findAssetsOverlappingPolygon = useCallback(
        (polygonFeatures: Feature<Polygon>[], assets: Asset[]) => {
            if (isLoadingAssets) {
                return [];
            }
            return assets.filter((asset) => {
                return polygonFeatures.some((feature) => {
                    try {
                        if (asset.lng && asset.lat) {
                            return booleanPointInPolygon([asset.lng, asset.lat], feature);
                        } else if (asset.hasGeometry()) {
                            const assetGeometry = multiLineString(asset.createSegmentCoords());
                            return booleanIntersects(feature, assetGeometry);
                        } else {
                            console.warn('Unknown geometry for asset', asset);
                            return false;
                        }
                    } catch (error) {
                        console.error('Error filtering asset', error, {
                            asset,
                            feature,
                        });
                        return false;
                    }
                });
            });
        },
        [isLoadingAssets],
    );

    const findAssetsInPolygons = useCallback(
        ({ polygons }: { polygons: Feature<Polygon>[] }) => {
            if (!assets) {
                return [];
            }
            return findAssetsOverlappingPolygon(polygons, assets);
        },
        [assets, findAssetsOverlappingPolygon],
    );

    return { findAssetsInPolygons };
}
