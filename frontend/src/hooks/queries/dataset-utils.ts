import { centroid } from "@turf/turf";
import type { Feature, GeoJsonProperties, Point, Polygon } from "geojson";
import { Asset, Dependency } from "@/models";
import type { FoundIcon } from "@/hooks/useFindIcon";
import { AssetState } from "@/models/Asset";
import { fetchBuildingAssets } from "@/api/combined";

interface DependencyData {
  dependencyUri: string;
  criticalityRating?: number;
  dependentNode: string;
  dependentName: string;
  dependentNodeType: string;
  providerNode: string;
  providerName: string;
  providerNodeType: string;
  osmID: string;
}

export function createDependencies(dependencies: DependencyData[]) {
  if (!dependencies && !Array.isArray(dependencies)) {
    return [];
  }
  return dependencies.map(
    (dependency) =>
      new Dependency({
        uri: dependency.dependencyUri,
        criticality: dependency?.criticalityRating ?? 0,
        dependent: {
          uri: dependency.dependentNode,
          name: dependency.dependentName,
          type: dependency.dependentNodeType,
        },
        provider: {
          uri: dependency.providerNode,
          name: dependency.providerName,
          type: dependency.providerNodeType,
        },
        osmID: dependency.osmID,
      }),
  );
}

export interface RawAsset {
  description?: string;
  buildinguse?: string;
  type: string;
  styles: FoundIcon;
  primaryCategory: string;
  secondaryCategory: string;
}

/**
 * Generate a centroid point from a GeoJSON Polygon geometry
 * @param polygonFeature A GeoJSON Feature with Polygon geometry
 * @returns A GeoJSON Point Feature representing the centroid
 */
function getCentroid(polygonFeature: Feature<Polygon>): Feature<Point> {
  return centroid(polygonFeature);
}

/**
 * Type guard to check if a feature is a Polygon
 */
function isPolygonFeature(
  feature: Feature,
): feature is Feature<Polygon, GeoJsonProperties> {
  return feature.geometry?.type === "Polygon";
}

export async function createAssets(): Promise<Asset[]> {
  const rawAssets: RawAsset[] = (await import("@/data/live-assets.json"))
    .default as RawAsset[];

  if (!rawAssets && !Array.isArray(rawAssets)) {
    return [];
  }

  const mappedAssets: Asset[][] = await Promise.all(
    rawAssets.map(async (rawAsset: RawAsset): Promise<Asset[]> => {
      const mappedAssets: Asset[] = [];
      const ngdAsset = await fetchBuildingAssets(undefined, rawAsset);
      ngdAsset.features.forEach((feature: Feature) => {
        const coordinates = isPolygonFeature(feature)
          ? getCentroid(feature).geometry?.coordinates
          : [0, 0];
        const type = rawAsset?.type;
        mappedAssets.push(
          new Asset({
            uri: `http://ndtp.co.uk/Building_${feature.id}`,
            type,
            lng: coordinates[0],
            lat: coordinates[1],
            geometry: [],
            dependent: {
              count: 0,
              criticalitySum: 0,
            },
            description: rawAsset.description ?? "",
            styles: rawAsset.styles,
            primaryCategory: rawAsset.primaryCategory,
            secondaryCategory: rawAsset.secondaryCategory,
            state: AssetState.Live,
          }),
        );
      });

      return mappedAssets;
    }),
  );

  return mappedAssets.flat();
}
