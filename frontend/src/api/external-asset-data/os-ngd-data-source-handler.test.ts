import { Feature, Point } from "geojson";
import { Link, OsNgdDataSourceHandler } from "./os-ngd-data-source-handler";
import { AssetSpecification } from "@/hooks/queries/dataset-utils";

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
  const handler = new OsNgdDataSourceHandler("test-locator");

  it("returns the correct URL without filters", () => {
    const assetSpecification = {
      collection: "Test",
    } as AssetSpecification;
    const urls = handler.buildUrlsForDataSource(assetSpecification);
    expect(urls.length).toBe(1);
    expect(urls[0]).toBe(
      "/transparent-proxy/os-ngd/features/ngd/ofa/v1/collections/Test/items?bbox=test-locator",
    );
  });

  it("returns the correct URL with filters", () => {
    const assetSpecification = {
      collection: "Test",
      description: ["first desc", "second desc"],
    } as AssetSpecification;
    const urls = handler.buildUrlsForDataSource(assetSpecification);
    expect(urls.length).toBe(2);
    expect(urls).toEqual([
      "/transparent-proxy/os-ngd/features/ngd/ofa/v1/collections/Test/items?bbox=test-locator&filter=description='first%20desc'",
      "/transparent-proxy/os-ngd/features/ngd/ofa/v1/collections/Test/items?bbox=test-locator&filter=description='second%20desc'",
    ]);
  });
});

describe("fetchDataForAssetSpecification", () => {
  const handler = new OsNgdDataSourceHandler("test-locator");

  const featureId = "99af3e40-aae5-40cd-9bb4-3aeef3b30269";
  const name = "Name of place";
  const response = {
    links: [] as Link[],
    features: [
      {
        id: featureId,
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [[[1, 2]]],
        },
        properties: {
          name1_text: name,
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
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(featureId);
    expect(result[0].type).toBe("Feature");
    expect(result[0].geometry.coordinates).toStrictEqual([[[1, 2]]]);
    expect(result[0].properties?.name).toBe(name);
  });

  it("handles multiple pages", async () => {
    response.links = [
      {
        href: "test&key=test",
        rel: "next",
      },
    ];
    // we stringify and then parse these so they are effectively cloned
    // otherwise the mocks will both return an empty array for links
    mockFetch(JSON.parse(JSON.stringify(response)));
    response.links = [];
    mockFetch(JSON.parse(JSON.stringify(response)));

    const result = (await handler.fetchDataForAssetSpecification(
      {} as AssetSpecification,
      "",
    )) as Feature<Point>[];

    expect(result.length).toBe(2);
    expect(fetch).toHaveBeenCalledWith("");
    expect(fetch).toHaveBeenCalledWith("test");
  });
});
