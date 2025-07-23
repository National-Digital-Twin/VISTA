import { AssetSpecification } from "@/hooks/queries/dataset-utils";
import type { Feature } from "geojson";
import { DataSourceHandler } from "./data-source-handler";

type FilterField = "description" | "type";
type Filters = Partial<Record<FilterField, string | string[]>>;
export type Link = {
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

export class OsNgdDataSourceHandler extends DataSourceHandler {
  /**
   * A function to build a query string.
   *
   * @param allFilters a set of filters which can be parameterised as a query string
   * @param filters a list of pre-configured filters (default is an empty list)
   * @returns a query string which can be suffixed to a URL
   */
  protected buildQueryString(
    allFilters: Filters,
    filters: [string, string][] = [],
  ): string {
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
    return filter ? `?bbox=${this.locator}&${filter}` : `?bbox=${this.locator}`;
  }

  /**
   * A function to build a list of query strings.
   *
   * @param filters a set of filters which can be parameterised as query strings
   * @returns a list of query strings
   */
  protected buildQueryStrings(filters: Filters): string[] {
    let { description } = filters;
    if (!description || description.length === 0) {
      return [this.buildQueryString(filters)];
    } else {
      description = Array.isArray(description) ? description : [description];

      return description.map((desc) => {
        const allFilters: [string, string][] = [["description", desc]];
        return this.buildQueryString(filters, allFilters);
      });
    }
  }

  /**
   * A function to build a list of OS NGD URLs.
   *
   * @param assetSpecification the specification of the asset
   * @returns
   */
  public buildUrlsForDataSource(
    assetSpecification: AssetSpecification,
  ): string[] {
    const queryStrings: string[] = this.buildQueryStrings(assetSpecification);
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
  protected transformUrl(url: string): string {
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
  public async fetchDataForAssetSpecification(
    assetSpecification: AssetSpecification,
    url?: string,
  ): Promise<Feature[]> {
    const allFeatures: Feature[] = [];
    while (url !== undefined) {
      const ngdFeatureCollection: NGDFeatureCollection =
        await this.fetchFromUrl(url);
      const features = this.mapNGDToGeoJSON(
        ngdFeatureCollection,
        assetSpecification,
      );
      allFeatures.push(...features);
      const nextUrl = ngdFeatureCollection.links.find(
        (item) => item.rel === "next",
      )?.href;
      url = nextUrl && this.transformUrl(nextUrl);
    }

    return allFeatures;
  }

  /**
   * A mapper function which creates GeoJSON features from the response returned by OS NGD.
   * It also filters out any features returned by OS NGD which do not match the specification of the asset.
   *
   * @param ngdData the response returned from the OS NGD API
   * @param assetSpecification the specification of the asset
   * @returns an array of Features
   */
  public mapNGDToGeoJSON(
    ngdData: NGDFeatureCollection,
    assetSpecification: AssetSpecification,
  ): Feature[] {
    return ngdData.features
      .filter((f) =>
        this.isMatchForAssetSpecificationFilters(assetSpecification, f),
      )
      .map((f) => {
        return {
          ...f,
          properties: {
            ...f.properties,
            name: (f.properties as { name1_text: string }).name1_text,
          },
        };
      });
  }
}
