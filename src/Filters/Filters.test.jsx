import { screen, render } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import Filters from ".";
import AssetProvider from "../AssetContext";
import ElementsProvider from "../ElementsContext";

describe("Filters should", () => {
  beforeEach(async () => {
    fetchMock.resetMocks();
    fetchMock.mockResponse(
      JSON.stringify([
        {
          uri: "http://telicent.io/test-data/iow#Water_Assessment",
          name: "Water",
          assCount: "94",
        },
        {
          uri: "http://telicent.io/test-data/iow#Energy_Assessment",
          name: "Energy",
          assCount: "25",
        },
      ])
    );

    await act(async () => {
      await render(<Filters selected={[]} setSelected={jest.fn()} />);
    });
  });

  it("render a checkbox for each option returned as display number of assets counts", () => {
    expect(screen.queryAllByRole("checkbox")).toHaveLength(2);
  });
});
