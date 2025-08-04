import type { FeatureCollection } from "geojson";
import { handlerRegistry } from "./handler-registry";
import { AssetSpecification } from "@/hooks/queries/dataset-utils";

/**
 * A function which fetches data based on an asset specification and a bounding box.
 *
 * @param assetSpecification the specification of the asset.
 * @param bounds a set of bounding box coordinates
 * @returns a FeatureCollection containing relevant data from an external API
 */
export const fetchLiveAssets = async (
  assetSpecification: AssetSpecification,
): Promise<FeatureCollection> => {
  const result: FeatureCollection = {
    type: "FeatureCollection",
    features: [],
  };
  const handler = handlerRegistry[assetSpecification.source];
  const urls: string[] = handler.buildUrlsForDataSource(assetSpecification);
  const allFeatures = await Promise.all(
    urls.map((url) =>
      handler.fetchDataForAssetSpecification(assetSpecification, url),
    ),
  );
  result.features.push(...allFeatures.flat());
  return result;
};
