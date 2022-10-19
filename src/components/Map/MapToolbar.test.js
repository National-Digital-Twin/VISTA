import { render } from "@testing-library/react";
import React from "react";
import MapToolbar from "./MapToolbar";

jest.mock("react-map-gl", () => ({
  __esModule: true,
  useMap: () => {
    return jest
    .fn()
    .mockReturnValue({
      current: undefined,
      telicentMap: { zoomIn: jest.fn(), zoomOut: jest.fn() },
    })
  }
}));

describe("Map toolbar component", () => {
  test("renders without errors", () => {
    render(<MapToolbar />);
  });
});
