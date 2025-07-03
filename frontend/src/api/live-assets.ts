import { LngLatBounds } from "maplibre-gl";
import type { FeatureCollection, Geometry } from "geojson";
import { RawAsset } from "@/hooks/queries/dataset-utils";

export interface NGDFeature {
  id: string;
  geometry: Geometry;
  properties: Record<string, any>;
  type: "Feature";
}

interface NGDFeatureCollection {
  type: "FeatureCollection";
  features: NGDFeature[];
}

type FilterField = "description" | "type";
type Filters = Partial<Record<FilterField, string>>;

/**
 * Map OS NGD FeatureCollection to standard GeoJSON FeatureCollection
 */
function mapNGDToGeoJSON(ngdData: NGDFeatureCollection): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: ngdData.features.map((f) => ({
      type: "Feature",
      geometry: f.geometry,
      properties: f.properties,
      id:
        f.properties.uprnreference.length > 0
          ? f.properties.uprnreference[0].uprn
          : f.id,
    })),
  };
}

function buildApiFilters(filters: Filters) {
  return Object.entries(filters)
    .filter(([key]) => filterableFields.includes(key))
    .map(
      ([key, value]) =>
        `filter=${encodeURIComponent(key)}='${encodeURIComponent(value)}'`,
    )
    .join("&");
}

const filterableFields = ["description", "buildinguse"];

const iowBounds = LngLatBounds.convert([
  [-1.585464, 50.562959],
  [-0.926285, 50.761219],
]);

export const fetchBuildingAssets = async (
  building: RawAsset,
  bounds: LngLatBounds = iowBounds,
): Promise<FeatureCollection> => {
  const bbox = bounds.toArray().toString();
  const filter = buildApiFilters(building);
  const url = `/transparent-proxy/os-ngd/features/ngd/ofa/v1/collections/bld-fts-building-4/items?bbox=${bbox}&${filter}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`An error occured while retrieving data from OS NGD`);
  }

  const ngdJson = await response.json();
  return mapNGDToGeoJSON(ngdJson);
};
