import { processAssetConnections, processAssets } from "./utils";

import Asset from "../../models/Asset";
const rawAssets = [
  {
    id: "W001",
    lat: "30.3404",
    lon: "-1.24455",
    name: "Chale wtw",
    type: "http://test.url/ontology#Facility",
    uri: "http://telicent.io/test-data/iow#W001",
  },
  {
    id: "W002",
    lat: "30.3404",
    lon: "-1.24455",
    name: "Defecation R Us",
    type: "http://test.url/ontology#Facility",
    uri: "http://telicent.io/test-data/iow#W002",
  },
];

const rawConnections = [
  {
    asset1Uri: "http://telicent.io/test-data/iow#W001",
    asset2Uri: "http://telicent.io/test-data/iow#W002",
    connUri: "http://telicent.io/test-data/iow#connector_W001_W002",
    criticality: "1.0",
  },
];

describe("processAssets", () => {
  const targetUri = "http://telicent.io/test-data/iow#W001";
  

  it("should generate assets", async () => {
    const rawAsset = rawAssets[0];

    const want = { [targetUri]: new Asset({ item: rawAsset, idx: 0 }) };
    want[targetUri].setLatitude(rawAsset.lat);
    want[targetUri].setLongitude(rawAsset.lon);
    const processedAsset = processAssets([rawAsset])

    expect(
      JSON.stringify(processedAsset)
    ).toEqual(JSON.stringify(want));
  });

  it("should process nothing", () => {
    expect(processAssets(undefined)).toBeUndefined();
  });
});

describe("generateConnectionAssessments", () => {
  const sourceUri = "http://telicent.io/test-data/iow#W001";
  const targetUri = "http://telicent.io/test-data/iow#W002";
  const processedAssets = processAssets(rawAssets);


  const processedConnections = processAssetConnections(
    rawConnections,
    processedAssets,

  );
  it("should generate connections", () => {
    expect(processedConnections[0].source).toBe(sourceUri);
    expect(processedConnections[0].target).toBe(targetUri);
  });
});
