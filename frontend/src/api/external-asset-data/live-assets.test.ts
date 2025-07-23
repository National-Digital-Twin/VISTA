import type { Feature, Geometry } from "geojson";
import { fetchLiveAssets } from "./live-assets";
import { handlerRegistry } from "./handler-registry";
import type { AssetSpecification } from "@/hooks/queries/dataset-utils";

jest.mock("./handler-registry");

describe("fetchLiveAssets", () => {
  const mockBuildUrls = jest.fn();
  const mockFetchData = jest.fn();

  const mockHandler = {
    buildUrlsForDataSource: mockBuildUrls,
    fetchDataForAssetSpecification: mockFetchData,
  };

  const mockSource = "test_source";

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup the handlerRegistry mock
    (handlerRegistry as any)[mockSource] = mockHandler;
  });

  it("fetches data for all URLs and combines features", async () => {
    const assetSpec: AssetSpecification = {
      source: mockSource,
    } as any;

    const urls = ["https://example.com/1", "https://example.com/2"];
    mockBuildUrls.mockReturnValue(urls);

    // Mock features returned from each URL fetch
    const features1: Feature<Geometry | null>[] = [
      { type: "Feature", geometry: null, properties: { id: 1 } },
    ];
    const features2: Feature<Geometry | null>[] = [
      { type: "Feature", geometry: null, properties: { id: 2 } },
    ];
    mockFetchData.mockImplementation(async (_spec, url) => {
      if (url === urls[0]) return features1;
      if (url === urls[1]) return features2;
      return [];
    });

    const result = await fetchLiveAssets(assetSpec);

    expect(mockBuildUrls).toHaveBeenCalledWith(assetSpec);

    expect(mockFetchData).toHaveBeenCalledTimes(urls.length);
    expect(mockFetchData).toHaveBeenCalledWith(assetSpec, urls[0]);
    expect(mockFetchData).toHaveBeenCalledWith(assetSpec, urls[1]);

    expect(result.type).toBe("FeatureCollection");
    expect(result.features).toHaveLength(features1.length + features2.length);
    expect(result.features).toEqual([...features1, ...features2]);
  });

  it("returns empty features if no URLs", async () => {
    const assetSpec: AssetSpecification = {
      source: mockSource,
    } as any;

    mockBuildUrls.mockReturnValue([]);

    const result = await fetchLiveAssets(assetSpec);

    expect(mockBuildUrls).toHaveBeenCalledWith(assetSpec);
    expect(mockFetchData).not.toHaveBeenCalled();
    expect(result.features).toHaveLength(0);
  });

  it("throws if handler not found", async () => {
    const assetSpec: AssetSpecification = {
      source: "non_existent_source",
    } as any;

    await expect(fetchLiveAssets(assetSpec)).rejects.toThrow();
  });
});
