import { centroid } from "@turf/turf";
import type {
  Feature,
  GeoJsonProperties,
  LineString,
  MultiLineString,
  MultiPoint,
  MultiPolygon,
  Point,
  Polygon,
} from "geojson";
import { Asset, Dependency } from "@/models";
import type { FoundIcon } from "@/hooks/useFindIcon";
import { AssetState } from "@/models/Asset";
import { fetchAssetInfo, fetchLiveAssets } from "@/api/combined";

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

export interface AssetClassFilter {
  filterName: string;
  filterValue: string | string[];
}

export interface AssetSpecification {
  type: string;
  collection: string;
  source: string;
  expectedCount: number;
  filters?: AssetClassFilter[];
  cqlFilter?: string;
  showAsPoint?: boolean;
  description?: string[];
  buildinguse?: string;
  roadstructure?: string;
  classificationField?: string;
  styles: FoundIcon;
  primaryCategory: string;
  secondaryCategory: string;
  knownIds?: string[];
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
 * Type guard to check if a feature is a MultiPoint
 */
function isMultiPointFeature(
  feature: Feature,
): feature is Feature<MultiPoint, GeoJsonProperties> {
  return feature.geometry?.type === "MultiPoint";
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
  } else if (isMultiPointFeature(feature)) {
    const coordinates = feature.geometry.coordinates;
    return coordinates[0].map(
      (_, i) =>
        coordinates.reduce((sum, p) => sum + p[i], 0) / coordinates.length,
    );
  } else {
    return [0, 0];
  }
}

/**
 * A function to build the URI of an asset given an ID.
 * @param id the ID of the asset
 * @returns the URI of the asset
 */
function getAssetUri(id: string): string {
  return `http://ndtp.co.uk/Building#${id}`;
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
  staticDataForAssetClass: any[],
): Asset {
  const coordinates = getCoordinatesforPointAsset(feature);
  const type = assetSpecification.type;

  const asset = new Asset({
    uri: getAssetUri(String(feature.id)),
    type,
    name: feature.properties?.name,
    lng: coordinates[0],
    lat: coordinates[1],
    geometry: feature.geometry,
    dependent: {
      count: 0,
      criticalitySum: 0,
    },
    styles: assetSpecification.styles,
    primaryCategory: assetSpecification.primaryCategory,
    secondaryCategory: assetSpecification.secondaryCategory,
  });

  if (assetSpecification.knownIds?.includes(String(feature.id))) {
    asset.state = AssetState.Static;
    const staticDataForAsset = staticDataForAssetClass.filter((d) =>
      d.uri.includes(feature.id),
    )[0];
    if (staticDataForAsset) {
      asset.dependent.count = staticDataForAsset.dependentCount;
      asset.dependent.criticalitySum =
        staticDataForAsset.dependentCriticalitySum;
    }
  } else {
    asset.state = AssetState.Live;
  }

  return asset;
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
 * A function which fetches data for any known assets from the Secure Agent Graph using the URI of the asset.
 * @param assetUris An array of known assets for which data is stored in the Secure Agent Graph.
 * @returns An array of asset data.
 */
async function fetchDataForAssetClass(assetUris: string[]): Promise<any[]> {
  return await Promise.all(
    assetUris.map(
      async (uri: string): Promise<any> =>
        await fetchAssetInfo(getAssetUri(uri)),
    ),
  );
}

export async function fetchAssetsForAssetSpecification(
  assetSpecification: AssetSpecification,
) {
  const mappedAssets: Asset[] = [];
  const liveAssets = await fetchLiveAssets(assetSpecification);
  const staticDataForAssetClass = await fetchDataForAssetClass(
    assetSpecification.knownIds ?? [],
  );

  liveAssets.features.forEach((feature: Feature) => {
    let asset: Asset;
    if (
      isPointFeature(feature) ||
      isMultiPointFeature(feature) ||
      isPolygonFeature(feature) ||
      isMultiPolygonFeature(feature)
    ) {
      asset = mapPointAsset(
        feature,
        assetSpecification,
        staticDataForAssetClass,
      );
      mappedAssets.push(asset);
    }
    if (isLineStringFeature(feature) || isMultiLineStringFeature(feature)) {
      asset = mapLinearAsset(feature, assetSpecification);
      mappedAssets.push(asset);
    }
  });

  return mappedAssets;
}

/**
 * A function to create an array of assets, using an asset specification.
 * @returns an array of Asset
 */
// export async function createAssets(
//   assetSpecifications: AssetSpecification[],
// ): Promise<Asset[]> {
//   if (!assetSpecifications && !Array.isArray(assetSpecifications)) {
//     return [];
//   }

//   const mappedAssets: Asset[][] = await Promise.all(
//     assetSpecifications.map(
//       async (assetClass: AssetSpecification): Promise<Asset[]> => {},
//     ),
//   );

//   return mappedAssets.flat();
// }
