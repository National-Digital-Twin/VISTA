import { centroid } from "@turf/turf";
import type {
  Feature,
  GeoJsonProperties,
  LineString,
  MultiLineString,
  MultiPolygon,
  Point,
  Polygon,
} from "geojson";
import { Asset, Dependency } from "@/models";
import type { FoundIcon } from "@/hooks/useFindIcon";
import { AssetState } from "@/models/Asset";
import { fetchLiveAssets } from "@/api/combined";

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

interface AssetClassFilter {
  filterName: string;
  filterValue: string;
}

export interface AssetSpecification {
  type: string;
  collection: string;
  source: string;
  filters?: AssetClassFilter[];
  showAsPoint?: boolean;
  description?: string[];
  buildinguse?: string;
  roadstructure?: string;
  classificationField?: string;
  styles: FoundIcon;
  primaryCategory: string;
  secondaryCategory: string;
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

/**
 * Generate a centroid point from a GeoJSON Polygon geometry
 * @param feature A GeoJSON Feature
 * @returns A GeoJSON Point Feature representing the centroid
 */
function getCentroid(feature: Feature): Feature<Point> {
  return centroid(feature);
}

/**
 * Type guard to check if a feature is a Polygon
 */
function isPolygonFeature(
  feature: Feature,
): feature is Feature<Polygon, GeoJsonProperties> {
  return feature.geometry?.type === "Polygon";
}

/**
 * Type guard to check if a feature is a MultiPolygon
 */
function isMultiPolygonFeature(
  feature: Feature,
): feature is Feature<MultiPolygon, GeoJsonProperties> {
  return feature.geometry?.type === "MultiPolygon";
}

/**
 * Type guard to check if a feature is a Point
 */
function isPointFeature(
  feature: Feature,
): feature is Feature<Point, GeoJsonProperties> {
  return feature.geometry?.type === "Point";
}

/**
 * Type guard to check if a feature is a MultiLineString
 */
function isMultiLineStringFeature(
  feature: Feature,
): feature is Feature<MultiLineString, GeoJsonProperties> {
  return feature.geometry?.type === "MultiLineString";
}

/**
 * Type guard to check if a feature is a LineString
 */
function isLineStringFeature(
  feature: Feature,
): feature is Feature<LineString, GeoJsonProperties> {
  return feature.geometry?.type === "LineString";
}

/**
 * Gets a longitude and latitude for a Point-type asset.
 * @param feature a GeoJSON feature
 * @returns a set of longitude/latitude coordinates
 */
function getCoordinatesforPointAsset(feature: Feature): number[] {
  if (isPolygonFeature(feature) || isMultiPolygonFeature(feature)) {
    return getCentroid(feature).geometry?.coordinates;
  } else if (isPointFeature(feature)) {
    return feature.geometry.coordinates;
  } else {
    return [0, 0];
  }
}

/**
 * A function to map a point-type asset from a feature.
 * @param feature a GeoJSON feature
 * @param assetSpecification the specification of the asset
 * @returns an instance of Asset
 */
function mapPointAsset(
  feature: Feature,
  assetSpecification: AssetSpecification,
): Asset {
  const coordinates = getCoordinatesforPointAsset(feature);
  const type = assetSpecification.type;
  const description = assetSpecification.type.includes("#")
    ? assetSpecification.type.split("#")[1]
    : "";
  return new Asset({
    uri: `http://ndtp.co.uk/Building_${feature.id}`,
    type,
    name: feature.properties?.name1_text,
    lng: coordinates[0],
    lat: coordinates[1],
    geometry: feature.geometry,
    dependent: {
      count: 0,
      criticalitySum: 0,
    },
    description,
    styles: assetSpecification.styles,
    primaryCategory: assetSpecification.primaryCategory,
    secondaryCategory: assetSpecification.secondaryCategory,
    state: AssetState.Live,
  });
}

/**
 * A function to map a linear-type asset from a feature.
 * @param feature a GeoJSON feature
 * @param assetSpecification the specification of the asset
 * @returns an instance of Asset
 */
function mapLinearAsset(
  feature: Feature,
  assetSpecification: AssetSpecification,
): Asset {
  const type = assetSpecification.type;
  const description = assetSpecification.type.includes("#")
    ? assetSpecification.type.split("#")[1]
    : "";
  const asset = new Asset({
    uri: `http://ndtp.co.uk/${feature.type}_${feature.id}`,
    type,
    geometry: feature.geometry,
    dependent: {
      count: 0,
      criticalitySum: 0,
    },
    description,
    styles: assetSpecification.styles,
    primaryCategory: assetSpecification.primaryCategory,
    secondaryCategory: assetSpecification.secondaryCategory,
    state: AssetState.Live,
    classification:
      feature.properties && assetSpecification.classificationField
        ? feature.properties[assetSpecification.classificationField]
        : undefined,
  });

  if (assetSpecification.showAsPoint) {
    const coordinates = centroid(feature).geometry?.coordinates;
    asset.lng = coordinates[0];
    asset.lat = coordinates[1];
  }
  return asset;
}

/**
 * A function to create an array of assets, using an asset specification.
 * @returns an array of Asset
 */
export async function createAssets(): Promise<Asset[]> {
  const assetSpecifications: AssetSpecification[] = (
    await import("@/data/live-assets.json")
  ).default as AssetSpecification[];

  if (!assetSpecifications && !Array.isArray(assetSpecifications)) {
    return [];
  }

  const mappedAssets: Asset[][] = await Promise.all(
    assetSpecifications.map(
      async (assetClass: AssetSpecification): Promise<Asset[]> => {
        const mappedAssets: Asset[] = [];
        const liveAssets = await fetchLiveAssets(assetClass);
        liveAssets.features.forEach((feature: Feature) => {
          let asset: Asset;
          if (
            isPointFeature(feature) ||
            isPolygonFeature(feature) ||
            isMultiPolygonFeature(feature)
          ) {
            asset = mapPointAsset(feature, assetClass);
            mappedAssets.push(asset);
          }
          if (
            isLineStringFeature(feature) ||
            isMultiLineStringFeature(feature)
          ) {
            asset = mapLinearAsset(feature, assetClass);
            mappedAssets.push(asset);
          }
        });

        return mappedAssets;
      },
    ),
  );

  return mappedAssets.flat();
}
