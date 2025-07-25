import type { Feature, GeoJsonProperties, Geometry } from "geojson";
import Papa from "papaparse";
import { DataSourceHandler } from "./data-source-handler";
import { AssetSpecification } from "@/hooks/queries/dataset-utils";

interface NaptanStop {
  longitude: number;
  latitude: number;
  ATCOCode: string;
  [key: string]: any;
}

export class NaptanDataSourceHandler extends DataSourceHandler {
  /**
   * A function to build a list of NAPTAN URLs.
   *
   * @param assetSpecification the specification of the asset
   * @returns
   */
  public buildUrlsForDataSource(
    _assetSpecification: AssetSpecification,
  ): string[] {
    return [
      `/transparent-proxy/naptan/v1/access-nodes?dataFormat=csv&atcoAreaCodes=${this.locator}`,
    ];
  }

  /**
   * Fetches CSV data from a given URL and parses it.
   *
   * @param url A URL
   * @returns Parsed CSV data as a list of {@link NaptanStop}
   */
  async fetchCsvFromUrl(url: string) {
    return await fetch(url)
      .then((res) => res.text())
      .then((csvText) => {
        return Papa.parse<NaptanStop>(csvText, { header: true });
      });
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
    url: string,
  ): Promise<Feature[]> {
    const features: Feature[] = [];
    const parsedData = await this.fetchCsvFromUrl(url);
    const stops = parsedData.data;
    for (const stop of stops) {
      features.push(this.createGeoJsonPointFeature(stop));
    }
    const seenLocations = new Set<string>();
    const featureForAssetType = features.filter((f) =>
      this.isMatchForAssetSpecificationFilters(assetSpecification, f),
    );
    return featureForAssetType.reduce<Feature[]>(
      (acc, f) =>
        this.mergeAssetsWithSameNameAtSameLocation(acc, f, seenLocations),
      [],
    );
  }

  /**
   * Evaluates whether a feature has already been marked for inclusion and if not pushes it to a list.
   *
   * @param featuresToInclude A list of features which have been marked for inclusion.
   * @param featureToEvaluate A featture to evaluate for inclusion.
   * @param seenLocations A list of locations which have already been seen.
   * @returns
   */
  private mergeAssetsWithSameNameAtSameLocation(
    featuresToInclude: Feature<Geometry, GeoJsonProperties>[],
    featureToEvaluate: Feature<Geometry, GeoJsonProperties>,
    seenLocations: Set<string>,
  ) {
    if (!featureToEvaluate.properties?.name) {
      featuresToInclude.push({ ...featureToEvaluate });
    } else {
      const location = `${featureToEvaluate.properties.name}_${featureToEvaluate.properties.LocalityName}`;
      if (seenLocations.has(location)) {
        return featuresToInclude;
      }
      seenLocations.add(location);
      featuresToInclude.push({ ...featureToEvaluate });
    }
    return featuresToInclude;
  }

  /**
   * Creates a GeoJSON feature from a given data point.
   * @param stop an instance of {@link NaptanStop}
   * @returns
   */
  private createGeoJsonPointFeature(stop: NaptanStop): Feature {
    const {
      Longitude: longitude,
      Latitude: latitude,
      ATCOCode: atcoCode,
      CommonName: name,
      ...properties
    } = stop;

    return {
      id: atcoCode,
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [
          this.convertToNumberIfString(longitude),
          this.convertToNumberIfString(latitude),
        ],
      },
      properties: {
        ...properties,
        name,
      },
    };
  }

  private convertToNumberIfString(val: number | string): number {
    return typeof val === "string" ? Number(val) : val;
  }
}
