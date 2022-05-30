import { screen, render } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import TelicentMemoMap from "./TelicentMap";

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
      expect(screen.queryByTestId("map")).toBeInTheDocument();
      expect(screen.queryByTestId("marker")).not.toBeInTheDocument();
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
      const marker = screen.getByTestId("marker");
      expect(screen.getByTestId("map")).toBeInTheDocument();
      expect(marker).toBeInTheDocument();
      expect(screen.getByTestId("lon")).toHaveTextContent(/longitude\: 0/i);
      expect(screen.getByTestId("lat")).toHaveTextContent(/latitude\: 0/i);
      expect(screen.getByTestId("color")).toHaveTextContent(/color: green/i);
    });
  });
});
