import { useCallback } from "react";
import {
  booleanPointInPolygon,
  booleanIntersects,
  multiLineString,
} from "@turf/turf";
import useGroupedAssets from "./queries/useGroupedAssets";

export default function useAssetsInPolygons() {
  const { assets, isLoadingAssets } = useGroupedAssets({});

  const findAssetsOverlappingPolygon = useCallback(
    (polygonFeatures, assets) => {
      if (isLoadingAssets) {
        return [];
      }
      return assets.filter((asset) => {
        return polygonFeatures.some((feature) => {
          if (asset.isPointAsset) {
            return booleanPointInPolygon([asset.lng, asset.lat], feature);
          } else if (asset.isLinearAsset) {
            const assetGeometry = multiLineString(asset.createSegmentCoords());
            return booleanIntersects(feature, assetGeometry);
          } else {
            console.warn("Unknown geometry for asset", asset);
            return false;
          }
        });
      });
    },
    [isLoadingAssets],
  );

  const findAssetsInPolygons = useCallback(
    ({ polygons }) => {
      return findAssetsOverlappingPolygon(polygons, assets);
    },
    [assets, findAssetsOverlappingPolygon],
  );

  return { findAssetsInPolygons };
}
