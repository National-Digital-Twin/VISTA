import { useCallback } from "react";
import {
  booleanPointInPolygon,
  booleanIntersects,
  lineString,
} from "@turf/turf";
import useGroupedAssets from "./queries/useGroupedAssets";

export default function useAssetsInPolygons() {
  const { allAssets } = useGroupedAssets({});

  const findAssetsOverlappingPolygon = useCallback(
    (polygonFeatures, assets) => {
      return assets.filter((asset) => {
        return polygonFeatures.some((feature) => {
          if (asset.isPointAsset) {
            return booleanPointInPolygon([asset.lng, asset.lat], feature);
          } else if (asset.isLinearAsset) {
            const assetGeometry = lineString(asset.createSegmentCoords());
            return booleanIntersects(feature, assetGeometry);
          } else {
            console.warn("Unknown geometry for asset", asset);
            return false;
          }
        });
      });
    },
    [],
  );

  const findAssetsInPolygons = useCallback(
    ({ polygons }) => {
      return findAssetsOverlappingPolygon(polygons, allAssets);
    },
    [allAssets, findAssetsOverlappingPolygon],
  );

  return { findAssetsInPolygons };
}
