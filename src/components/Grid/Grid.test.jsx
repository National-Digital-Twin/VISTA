import { screen, render } from "@testing-library/react";
import AssetProvider from "../../AssetContext";
import TelicentGrid from "./index";

const assets = [
  {
    id: "fed",
    uri: "http://fed.co/test-data/iow#W001",
    name: "Federal Reserve",
    gridIndex: 1,
    scoreColour: "hsl(117.96610169491527,100%, 50%)",
    countColour: "hsl(117.96610169491527,100%, 50%)",
    count: 1,
    criticality: 3,
    onClick: jest.fn(),
  },
  {
    id: "irs",
    uri: "http://irs.co/test-data/iow#W002",
    name: "Internal Revenue System",
    gridIndex: 2,
    scoreColour: "hsl(117.96610169491527,100%, 50%)",
    countColour: "hsl(117.96610169491527,100%, 50%)",
    count: 1,
    criticality: 3,
    onClick: jest.fn(),
  },
];

const connections = [
  {
    category: "connection",
    uri: "http://fed.co/iow#connector_W001_W002",
    source: "http://fed.co/test-data/iow#W001",
    sourceName: "Federal Reserve",
    sourceLat: 40.5,
    sourceLon: 20.3,
    sourceAsset: assets[0],
    sourceScoreColour: undefined,
    target: "http://irs.co/test-data/iow#W002",
    targetLat: 40.3,
    targetLon: 20.1,
    targetAsset: assets[1],
    targetName: "Internal Revenue Service",
    targetScoreColour: undefined,
    criticality: 3,
    label: "W001-W002",
  },
];

xdescribe("Grid should populate assets and connections", () => {
  describe("Assets should", () => {
    beforeEach(() => {
      render(
        <AssetProvider>
          <TelicentGrid assets={[assets[0]]} />
        </AssetProvider>
      );
    });

    it("populate first cell in row with asset id", () => {
      const buttons = screen.getAllByRole("button", { name: /fed/i });
      expect(buttons).toHaveLength(2);
    });

    it("show human readable name", () => {
      const cells = screen.getAllByRole("cell", { name: /fed/i });
      cells.forEach((cell) => {
        expect(cell).toHaveTextContent(/federal reserve/i);
      });
    });
  });

  describe("connections should", () => {
    beforeEach(() => {
      render(
        <AssetProvider>
          <TelicentGrid connections={connections} assets={assets} />
        </AssetProvider>
      );
    });

    it("show criticality for both connections in the grid.", () => {
      const buttons = screen.getAllByRole("button", { name: 3 });
      expect(buttons).toHaveLength(2);
    });
  });

  describe("when no data is passed grid should", () => {
    beforeEach(() => {
      render(
        <AssetProvider>
          <TelicentGrid />
        </AssetProvider>
      );
    });
    it("should not render any connections if none are passed", () => {
      const cells = screen.queryAllByRole("cell");
      const buttons = screen.queryAllByRole("button", { name: /3/ });
      expect(buttons).toHaveLength(0);
      expect(cells).toHaveLength(0);
    });
  });
});
