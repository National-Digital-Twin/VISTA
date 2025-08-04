import { Feature, Point } from "geojson";
import { AssetSpecification } from "@/hooks/queries/dataset-utils";
import { OsNamesDataSourceHandler } from "./os-names-data-source-handler";

global.fetch = jest.fn();

function mockFetch(obj: any) {
  (fetch as jest.Mock).mockImplementationOnce(() =>
    Promise.resolve({
      ok: true,
      json: jest.fn().mockResolvedValue(obj),
    }),
  );
}

describe("buildUrlsForDataSource", () => {
  const handler = new OsNamesDataSourceHandler("test-locator");

  it("returns the correct URL with local type filter", () => {
    const assetSpecification = {
      description: ["First_Type"],
    } as AssetSpecification;
    const urls = handler.buildUrlsForDataSource(assetSpecification);
    expect(urls).toHaveLength(1);
    expect(urls).toEqual([
      "/transparent-proxy/os-names/search/names/v1/find?query=Wight&fq=BBOX:test-locator&fq=LOCAL_TYPE:First_Type",
    ]);
  });
});

describe("fetchDataForAssetSpecification", () => {
  const handler = new OsNamesDataSourceHandler("test-locator");

  const featureId = "osgb1000000011111111";
  const name = "Place X";
  const response = {
    results: [
      {
        GAZETTEER_ENTRY: {
          ID: featureId,
          NAME1: name,
          GEOMETRY_X: 429157,
          GEOMETRY_Y: 623009,
        },
      },
    ],
  };

  it("returns correct feature from one data point", async () => {
    mockFetch(response);

    const result = (await handler.fetchDataForAssetSpecification(
      {} as AssetSpecification,
      "",
    )) as Feature<Point>[];

    expect(fetch).toHaveBeenCalledWith("");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(featureId);
    expect(result[0].type).toBe("Feature");
    expect(result[0].geometry.coordinates).toStrictEqual([
      -1.5400079624974126, 55.499999613061284,
    ]);
    expect(result[0].properties?.name).toBe(name);
  });
});
