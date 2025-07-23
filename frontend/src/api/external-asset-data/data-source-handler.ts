import type { Feature } from "geojson";
import { AssetSpecification } from "@/hooks/queries/dataset-utils";

export abstract class DataSourceHandler {
  protected readonly locator: string;

  constructor(locator: string) {
    this.locator = locator;
  }

  /**
   * A function to fetch data from an external API and handle any errors.
   *
   * @param url a URL which can be used to fetch data
   * @returns a JSON representation of the response
   */
  async fetchFromUrl(url: string) {
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
  protected isMatchForAssetSpecificationFilters(
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

  abstract buildUrlsForDataSource(
    assetSpecification: AssetSpecification,
  ): string[];

  abstract fetchDataForAssetSpecification(
    assetSpecification: AssetSpecification,
    url: string,
  ): Promise<Feature[]>;
}
