import { LngLatBounds } from "maplibre-gl";
import type { FeatureCollection, Geometry } from "geojson";

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
      id: f.id,
    })),
  };
}

const iowBounds = LngLatBounds.convert([
  [-1.585464, 50.562959],
  [-0.926285, 50.761219],
]);

export const fetchBuildingAssets = async (
  bounds: maplibregl.LngLatBounds = iowBounds,
  buildingDescription: string,
): Promise<FeatureCollection> => {
  const bbox = bounds.toArray().toString();
  const url = `https://api.os.uk/features/ngd/ofa/v1/collections/bld-fts-building-4/items?&bbox=${bbox}&filter=description='${buildingDescription}'`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`An error occured while retrieving data from OS NGD`);
  }

  const ngdJson = await response.json();
  return mapNGDToGeoJSON(ngdJson);
};
