import proj4 from "proj4";

import { Feature } from "geojson";
import { DataSourceHandler } from "./data-source-handler";
import { AssetSpecification } from "@/hooks/queries/dataset-utils";

proj4.defs(
  "EPSG:27700",
  "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 " +
    "+x_0=400000 +y_0=-100000 +ellps=airy " +
    "+towgs84=446.448,-125.157,542.06,0.1502,0.2470,0.8421,-20.4894 " +
    "+units=m +no_defs",
);

export class OsNamesDataSourceHandler extends DataSourceHandler {
  /**
   * A function to build a list of OS Names URLs.
   *
   * @param assetSpecification the specification of the asset
   * @returns
   */
  public buildUrlsForDataSource(
    assetSpecification: AssetSpecification,
  ): string[] {
    return [
      `/transparent-proxy/os-names/search/names/v1/find?query=Wight&fq=BBOX:${this.locator}&fq=LOCAL_TYPE:${assetSpecification.description}`,
    ];
  }

  public async fetchDataForAssetSpecification(
    assetSpecification: AssetSpecification,
    url: string,
  ): Promise<Feature[]> {
    const response = await this.fetchFromUrl(url);
    return response.results ? this.mapResponseToFeatures(response) : [];
  }

  private mapResponseToFeatures(response): Feature[] {
    return response.results.map((r) => {
      const data = r.GAZETTEER_ENTRY;
      return {
        id: data.ID,
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: this.mapBngCoordinatesToLatitudeLongitude(
            data.GEOMETRY_X,
            data.GEOMETRY_Y,
          ),
        },
        properties: {
          name: data.NAME2 ?? data.NAME1,
        },
      };
    });
  }

  private mapBngCoordinatesToLatitudeLongitude(
    easting: any,
    northing: any,
  ): number[] {
    return proj4("EPSG:27700", "EPSG:4326", [easting, northing]);
  }
}
