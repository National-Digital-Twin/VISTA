import { screen, render, waitFor } from "@testing-library/react";
import { ElementsProvider } from "../../context";
import { server } from "../../mocks/server";
import Categories from "./Dataset";


describe("Categories component", () => {
  beforeAll(() => server.listen());
  beforeEach(() => server.resetHandlers());
  afterAll(() => server.close());
  
  test("renders options with total count", async () => {
    render(<ElementsProvider><Categories /></ElementsProvider>);
    // await waitFor(() => expect(screen.queryByText("Loading")).not.toBeInTheDocument());

    await waitFor(() => expect(screen.getAllByRole("checkbox")).toHaveLength(2));
    expect(screen.getByRole("checkbox", { name: "Energy [25]" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Transport [44]" })).toBeInTheDocument();
  });
});
