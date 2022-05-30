import { screen, render } from "@testing-library/react";
import DataPresentation from ".";
import { AssetContext } from "../AssetContext";
import { ElementsContext } from "../ElementsContext";

jest.mock("react-map-gl", () => {
  return {
    __esModule: true,
    default: () => {
      return <div id="map"></div>;
    },
    Marker: ({ latitude, longitude, color, name }) => {
      return (
        <div id="marker">
          <span id="lon">Longitude: {longitude}</span>
          <span id="lat">Latitude: {latitude}</span>
          <span id="color">Color: {color}</span>
          <span id="name">Name: {name}</span>
        </div>
      );
    },
  };
});

describe("DataPresentation should", () => {
  describe("asset", () => {
    beforeEach(() => {
      const assetsRef = {
        current: [
          {
            uri: "node-1",
            lat: 0,
            lon: 0,
            scoreColour: "white",
            name: "element-name",
          },
        ],
      };

      const connectionsRef = {
        current: [],
      };

      render(
        <AssetContext.Provider value={{ type: "asset", selected: "node-1" }}>
          <ElementsContext.Provider value={{ assetsRef, connectionsRef }}>
            <DataPresentation />
          </ElementsContext.Provider>
        </AssetContext.Provider>
      );
    });

    it("should render map and details", () => {
      expect(screen.queryByRole("heading", { level: 5 })).toHaveTextContent(
        "element-name"
      );
      expect(screen.getByTestId("map")).toBeInTheDocument();
    });
  });

  describe("connection", () => {
    beforeEach(() => {
      const assetsRef = {
        current: [
          {
            uri: "node-1",
            lat: 0,
            lon: 0,
            scoreColour: "white",
            name: "POI-1",
          },
          {
            uri: "node-2",
            lat: 1.0,
            lon: 1.0,
            scoreColour: "white",
            name: "POI-2",
          },
        ],
      };

      const connectionsRef = {
        current: [
          {
            category: "connection",
            uri: "connection-1",
            source: "node-1",
            target: "node-2",
          },
        ],
      };

      render(
        <AssetContext.Provider
          value={{ type: "connection", selected: "connection-1" }}
        >
          <ElementsContext.Provider value={{ assetsRef, connectionsRef }}>
            <DataPresentation />
          </ElementsContext.Provider>
        </AssetContext.Provider>
      );
    });

    it("should render map and details", () => {
      expect(
        screen.queryByRole("heading", { level: 5 })
      ).not.toBeInTheDocument();
      expect(screen.getByText("connects")).toBeInTheDocument();
      expect(screen.getByText("POI-1")).toBeInTheDocument();
      expect(screen.getByText("and")).toBeInTheDocument();
      expect(screen.getByText("POI-2")).toBeInTheDocument();
    });
  });
});
