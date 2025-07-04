import { LngLatBounds } from "maplibre-gl";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { RawAsset } from "@/hooks/queries/dataset-utils";

type FilterField = "description" | "type";
type Filters = Partial<Record<FilterField, string>>;
type Link = {
  href: string;
  rel?: string;
  type?: string;
  title?: string;
};

export interface NGDFeature {
  id: string;
  geometry: Geometry;
  properties: Record<string, any>;
  type: "Feature";
}

interface NGDFeatureCollection {
  type: "FeatureCollection";
  links: Link[];
  features: NGDFeature[];
}

/**
 * Map OS NGD FeatureCollection to standard GeoJSON FeatureCollection
 */
function mapNGDToGeoJSON(ngdData: NGDFeatureCollection): Feature[] {
  return ngdData.features.map((f) => ({
    type: "Feature",
    geometry: f.geometry,
    properties: f.properties,
    id:
      f.properties.uprnreference.length > 0
        ? f.properties.uprnreference[0].uprn
        : f.id,
  }));
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

async function getFromOsNgd(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`An error occured while retrieving data from OS NGD`);
  }

  return await response.json();
}

function buildUrl(building: RawAsset, bounds: LngLatBounds): string {
  const bbox = bounds.toArray().toString();
  const filter = buildApiFilters(building);
  return `/transparent-proxy/os-ngd/features/ngd/ofa/v1/collections/bld-fts-building-4/items?bbox=${bbox}&${filter}`;
}

export const fetchBuildingAssets = async (
  building: RawAsset,
  bounds: LngLatBounds = iowBounds,
): Promise<FeatureCollection> => {
  const result: FeatureCollection = {
    type: "FeatureCollection",
    features: [],
  };
  let url: string | undefined = buildUrl(building, bounds);

  while (url !== undefined) {
    const ngdFeatureCollection: NGDFeatureCollection = await getFromOsNgd(url);
    const features = mapNGDToGeoJSON(ngdFeatureCollection);
    result.features.push(...features);
    url = ngdFeatureCollection.links.find((item) => item.rel === "next")?.href;
  }

  return result;
};
