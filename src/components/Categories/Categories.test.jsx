import { act, screen, render } from "@testing-library/react";
import Categories from "./Categories";

describe("Categories component should", () => {
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
      await render(<Categories selected={[]} setSelected={jest.fn()} />);
    });
  });

  it("render a checkbox for each option returned as display number of assets counts", () => {
    expect(screen.queryAllByRole("checkbox")).toHaveLength(2);
  });
});
