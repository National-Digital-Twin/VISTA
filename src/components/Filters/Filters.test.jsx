import {act, screen, render } from "@testing-library/react";
import Filters from "./index";

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
