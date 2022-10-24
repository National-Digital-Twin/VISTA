import { screen, render, waitFor } from "@testing-library/react";
import { ElementsProvider } from "../../context";
import { DATASET } from "../../mocks";
import Categories from "./Categories";

describe("Categories component", () => {
  test("renders options with total count", async () => {
    render(
      <ElementsProvider>
        <Categories />
      </ElementsProvider>
    );
    // await waitFor(() => expect(screen.queryByText("Loading")).not.toBeInTheDocument());

    await waitFor(() => expect(screen.getAllByRole("checkbox")).toHaveLength(DATASET.length));
    expect(screen.getByRole("checkbox", { name: "Energy [25]" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Medical [32]" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Transport [44]" })).toBeInTheDocument();
  });
});
