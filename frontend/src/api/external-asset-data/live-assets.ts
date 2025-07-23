import type { FeatureCollection } from "geojson";
import { AssetSpecification } from "@/hooks/queries/dataset-utils";
import { handlerRegistry } from "./handler-registry";

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
  for (const url of urls) {
    const features = await handler.fetchDataForAssetSpecification(
      assetSpecification,
      url,
    );
    result.features.push(...features);
  }
  return result;
};
