import { screen, render } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import TelicentMemoMap from "./TelicentMap";
import { createHeadlessContext } from "@luma.gl/test-utils";

jest.mock("react-map-gl", () => {
  return {
    __esModule: true,
    default: ({ children }) => {
      return <div id="map">{children}</div>;
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

describe("map ", () => {
  describe(" no element", () => {
    beforeEach(async () => {
      await act(async () => {
        await render(<TelicentMemoMap />);
      });
    });

    it("should not show marker", () => {
      expect(screen.queryByTestId("deckgl-wrapper")).toBeInTheDocument();
    });
  });

  describe(" valid element", () => {
    beforeEach(async () => {
      await act(async () => {
        await render(
          <TelicentMemoMap
            element={{ lat: 0, lon: 0, scoreColour: "green", name: "test" }}
          />
        );
      });
    });

    it("should render map based on element input", () => {
      expect(screen.getByTestId("deckgl-wrapper")).toBeInTheDocument();
    });
  });
});
