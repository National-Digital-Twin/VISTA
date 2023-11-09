import { screen, waitForElementToBeRemoved, within } from "@testing-library/react";
import { rest } from "msw";

import { ElementsContext, ElementsProvider } from "context";
import { createParalogEndpoint } from "../../../api/utils";
import { server } from "mocks";
import { renderWithQueryClient } from "test-utils";

import FloodAreas from "../FloodAreas";

const waitForFloodAreasToLoad = async () => {
  await waitForElementToBeRemoved(() => screen.queryByText("Fetching flood areas"));
};

describe("Flood areas component", () => {
  test("renders flood watch and flood areas", async () => {
    const { user } = renderWithQueryClient(
      <ElementsProvider>
        <FloodAreas selectedFloodAreas={[]} setSelectedFloodAreas={jest.fn()} />
      </ElementsProvider>
    );
    await waitForFloodAreasToLoad();

    const floodWatchAreaListItems = screen.getAllByRole("listitem");
    const toggleBtns = screen.getAllByRole("button", { name: "Toggle" });

    expect(floodWatchAreaListItems).toHaveLength(1);
    expect(
      within(floodWatchAreaListItems[0]).getByRole("checkbox", { name: "Eastern Yar" })
    ).toBeInTheDocument();

    await user.click(toggleBtns[0]);
    expect(
      within(floodWatchAreaListItems[0]).getByRole("checkbox", {
        name: "Sandown, Brading and Bembridge on the Eastern Yar",
      })
    ).toBeInTheDocument();
    expect(
      within(floodWatchAreaListItems[0]).getByRole("checkbox", {
        name: "Whitwell, Wroxall, Langbridge, Alverstone on the Eastern Yar",
      })
    ).toBeInTheDocument();
  });

  test("renders error when flood watch and flood areas are not found", async () => {
    server.use(
      rest.get(createParalogEndpoint("flood-watch-areas"), (req, res, ctx) => {
        return res.once(ctx.status(404), ctx.json({ detail: "Flood areas not found" }));
      })
    );
    renderWithQueryClient(
      <ElementsProvider>
        <FloodAreas selectedFloodAreas={[]} setSelectedFloodAreas={jest.fn()} />
      </ElementsProvider>
    );
    await waitForFloodAreasToLoad();
    expect(screen.getByText("Flood areas not found")).toBeInTheDocument();
  });

  test("renders calls onFloodAreaSelect when checkbox is clicked", async () => {
    const mockOnFloodAreaSelect = jest.fn();
    const { user } = renderWithQueryClient(
      <ElementsContext.Provider value={{ onFloodAreaSelect: mockOnFloodAreaSelect }}>
        <FloodAreas />
      </ElementsContext.Provider>
    );
    await waitForFloodAreasToLoad();

    await user.click(screen.getByRole("checkbox", { name: "Eastern Yar" }));
    expect(mockOnFloodAreaSelect).toHaveBeenCalled();
  });
});
