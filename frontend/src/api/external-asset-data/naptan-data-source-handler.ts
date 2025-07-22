import { AssetSpecification } from "@/hooks/queries/dataset-utils";
import type { Feature } from "geojson";
import { DataSourceHandler } from "./data-source-handler";
import Papa from "papaparse";

interface NaptanStop {
  longitude: number;
  latitude: number;
  ATCOCode: string;
  [key: string]: any;
}

export class NaptanDataSourceHandler extends DataSourceHandler {
  protected createGeoJsonPointFeature(stop: NaptanStop): Feature {
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
        coordinates: [longitude, latitude],
      },
      properties: {
        ...properties,
        name,
      },
    };
  }
  /**
   * A function to build a list of NAPTAN URLs.
   *
   * @param assetSpecification the specification of the asset
   * @returns
   */
  public buildUrlsForDataSource(
    assetSpecification: AssetSpecification,
  ): string[] {
    return [
      `/transparent-proxy/naptan/v1/access-nodes?dataFormat=csv&atcoAreaCodes=${this.locator}`,
    ];
  }

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
    let features: Feature[] = [];
    const parsedData = await this.fetchCsvFromUrl(url);
    const stops = parsedData.data;
    for (const stop of stops) {
      features.push(this.createGeoJsonPointFeature(stop));
    }
    return features.filter((f) =>
      this.isMatchForAssetSpecificationFilters(assetSpecification, f),
    );
  }
}
