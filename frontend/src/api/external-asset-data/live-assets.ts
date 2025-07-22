import { LngLatBounds } from "maplibre-gl";
import type { FeatureCollection } from "geojson";
import { DataSourceHandler } from "./data-source-handler";
import { OsNgdDataSourceHandler } from "./os-ngd-data-source-handler";
import { NaptanDataSourceHandler } from "./naptan-data-source-handler";
import { CQCDataSourceHandler } from "./cqc-data-source-handler";
import { AssetSpecification } from "@/hooks/queries/dataset-utils";

const iowBounds = LngLatBounds.convert([
  [-1.585464, 50.562959],
  [-0.926285, 50.761219],
]);

export const handlerRegistry: Record<string, DataSourceHandler> = {
  os_ngd: new OsNgdDataSourceHandler(iowBounds.toArray().toString()),
  naptan: new NaptanDataSourceHandler("230"),
  cqc: new CQCDataSourceHandler("Isle of Wight"),
};

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
