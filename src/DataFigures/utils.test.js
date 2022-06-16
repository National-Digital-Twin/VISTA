import { processAssetConnections, processAssets } from "./utils";

import Asset from "./Asset";
import ConnectionAssessment from "./ConnectionAssessment";
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
  const selectedLength = 1;

  it("should generate assets", async () => {
    const rawAsset = rawAssets[0];

    const want = { [targetUri]: new Asset(rawAsset, 0) };
    want[targetUri].setLatitude(rawAsset.lat);
    want[targetUri].setLongitude(rawAsset.lon);

    expect(
      JSON.stringify(processAssets([rawAssets[0]], selectedLength))
    ).toEqual(JSON.stringify(want));
  });

  it("should process nothing", () => {
    expect(processAssets(undefined, 0)).toBeUndefined();
  });
});

xdescribe("generateConnectionAssessments", () => {
  const sourceUri = "http://telicent.io/test-data/iow#W001";
  const targetUri = "http://telicent.io/test-data/iow#W002";
  const processedAssets = processAssets(rawAssets, rawAssets.length);
  processedAssets[sourceUri].incrementCriticalityBy(1);
  processedAssets[targetUri].incrementCriticalityBy(1);
  const selectedLength = 1;

  const connection = new ConnectionAssessment(
    rawConnections[0],
    processedAssets[sourceUri],
    processedAssets[targetUri],
    1
  );

  const processedConnections = processAssetConnections(
    [processedAssets, rawConnections],
    processedAssets,
    selectedLength
  );
  it("should generate connections", () => {
    expect(JSON.stringify(processedConnections.reports)).toBe(
      JSON.stringify({
        "http://telicent.io/test-data/iow#connector_W001_W002": connection,
      })
    );
  });
});
