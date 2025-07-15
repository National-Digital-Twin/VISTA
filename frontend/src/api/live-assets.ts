import { LngLatBounds } from "maplibre-gl";
import type { Feature, FeatureCollection } from "geojson";
import { AssetSpecification } from "@/hooks/queries/dataset-utils";

type FilterField = "description" | "type";
type Filters = Partial<Record<FilterField, string | string[]>>;
type Link = {
  href: string;
  rel?: string;
  type?: string;
  title?: string;
};

/**
 * Represents the data structure returned from the OS NGD API.
 */
interface NGDFeatureCollection {
  type: "FeatureCollection";
  links: Link[];
  features: Feature[];
}

const filterableFields = ["buildinguse", "roadstructure"];

const iowBounds = LngLatBounds.convert([
  [-1.585464, 50.562959],
  [-0.926285, 50.761219],
]);

/**
 * A function to fetch data from an external API and handle any errors.
 *
 * @param url a URL which can be used to fetch data
 * @returns a JSON representation of the response
 */
async function fetchFromUrl(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`An error occured while retrieving data from URL ${url}`);
  }

  return await response.json();
}

/**
 * Checks if a feature's property is a match for any specific filters required for an asset.
 * For example, the `physicalcontainment` filter equal to `In Culvert` for the waterlink dataset in OS NGD.
 * This is required only when the property is not filterable via the API.
 *
 * @param assetSpecification the specification of the asset to use to query the API
 * @param feature the feature whose properties are to be evaluated against the asset specification's filters
 * @returns true if the feature properties match the asset specification's filters
 */
function isMatchForAssetSpecificationFilters(
  assetSpecification: AssetSpecification,
  feature: Feature,
): boolean {
  if (assetSpecification.filters) {
    const filtersToMatch = assetSpecification.filters.length;
    const matchedFilters = assetSpecification.filters.filter(
      (f) =>
        feature.properties?.[f.filterName] &&
        feature.properties[f.filterName] === f.filterValue,
    );
    return filtersToMatch === matchedFilters.length;
  }
  return true;
}

/**
 * A mapper function which creates GeoJSON features from the response returned by OS NGD.
 * It also filters out any features returned by OS NGD which do not match the specification of the asset.
 *
 * @param ngdData the response returned from the OS NGD API
 * @param assetSpecification the specification of the asset
 * @returns an array of Features
 */
function mapNGDToGeoJSON(
  ngdData: NGDFeatureCollection,
  assetSpecification: AssetSpecification,
): Feature[] {
  return ngdData.features
    .filter((f) => isMatchForAssetSpecificationFilters(assetSpecification, f))
    .map((f) => ({
      type: "Feature",
      geometry: f.geometry,
      properties: f.properties,
      id:
        f.properties?.uprnreference && f.properties.uprnreference.length > 0
          ? f.properties.uprnreference[0].uprn
          : f.id,
    }));
}

/**
 * A function to build a query string.
 *
 * @param bounds a set of bounding box coordinates
 * @param allFilters a set of filters which can be parameterised as a query string
 * @param filters a list of pre-configured filters (default is an empty list)
 * @returns a query string which can be suffixed to a URL
 */
function buildQueryString(
  bounds: LngLatBounds,
  allFilters: Filters,
  filters: [string, string][] = [],
): string {
  const bbox = bounds.toArray().toString();
  for (const [key, value] of Object.entries(allFilters)) {
    if (typeof value === "string" && filterableFields.includes(key)) {
      filters.push([key, value]);
    }
  }

  const filter: string = filters
    .map(
      ([key, val]) =>
        `filter=${encodeURIComponent(key)}='${encodeURIComponent(val)}'`,
    )
    .join("&");
  return `?bbox=${bbox}&${filter}`;
}

/**
 * A function to build a list of query strings.
 *
 * @param filters a set of filters which can be parameterised as query strings
 * @param bounds a set of bounding box coordinates
 * @returns a list of query strings
 */
function buildQueryStrings(filters: Filters, bounds: LngLatBounds): string[] {
  let { description } = filters;
  if (!description || description.length === 0) {
    return [buildQueryString(bounds, filters)];
  } else {
    description = Array.isArray(description) ? description : [description];

    return description.map((desc) => {
      const allFilters: [string, string][] = [["description", desc]];
      return buildQueryString(bounds, filters, allFilters);
    });
  }
}

/**
 * A function to build a list of OS NGD URLs.
 *
 * @param assetSpecification the specification of the asset
 * @param bounds a set of bounding box coordinates
 * @returns
 */
function buildUrls(
  assetSpecification: AssetSpecification,
  bounds: LngLatBounds,
): string[] {
  const queryStrings: string[] = buildQueryStrings(assetSpecification, bounds);
  const urls: string[] = [];
  for (const queryString of queryStrings) {
    urls.push(
      `/transparent-proxy/os-ngd/features/ngd/ofa/v1/collections/${assetSpecification.collection}/items${queryString}`,
    );
  }
  return urls;
}

/**
 * A transformation function to replace the external address of the NGD API in a URL with the proxy route.
 * @param url the URL to transform
 * @returns the transformed URL
 */
function transformUrl(url: string): string {
  const url_replaced_stem = url.replace(
    "https://api.os.uk",
    "/transparent-proxy/os-ngd",
  );
  return url_replaced_stem.split("&key")[0];
}

/**
 * A function which fetches all data from the OS NGD API for a given asset specification.
 *
 * @param assetSpecification the specification of the asset
 * @param url the URL to be queried for data
 * @returns a list of mapped GeoJSON-compatible features
 */
async function fetchLiveAssetsPerFilter(
  assetSpecification: AssetSpecification,
  url?: string,
): Promise<Feature[]> {
  const allFeatures: Feature[] = [];
  while (url !== undefined) {
    const ngdFeatureCollection: NGDFeatureCollection = await fetchFromUrl(url);
    const features = mapNGDToGeoJSON(ngdFeatureCollection, assetSpecification);
    allFeatures.push(...features);
    const nextUrl = ngdFeatureCollection.links.find(
      (item) => item.rel === "next",
    )?.href;
    url = nextUrl && transformUrl(nextUrl);
  }

  return allFeatures;
}

/**
 * A function which fetches data based on an asset specification and a bounding box.
 *
 * @param assetSpecification the specification of the asset.
 * @param bounds a set of bounding box coordinates
 * @returns a FeatureCollection containing relevant data from an external API
 */
export const fetchLiveAssets = async (
  assetSpecification: AssetSpecification,
  bounds: LngLatBounds = iowBounds,
): Promise<FeatureCollection> => {
  const result: FeatureCollection = {
    type: "FeatureCollection",
    features: [],
  };
  const urls: string[] = buildUrls(assetSpecification, bounds);
  for (const url of urls) {
    const features = await fetchLiveAssetsPerFilter(assetSpecification, url);
    result.features.push(...features);
  }
  return result;
};
