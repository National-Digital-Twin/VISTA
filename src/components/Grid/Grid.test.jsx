import { screen, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../mocks/server";
import { ElementsContext, ElementsProvider } from "../../context";
import Categories from "../Categories/Categories";
import TelicentGrid from "./index";
import * as utils from "./../DataFigures/utils";

const user = userEvent.setup();

describe("Grid component", () => {
  beforeAll(() => server.listen());
  beforeEach(() => {
    server.resetHandlers();
    jest.restoreAllMocks();
  });
  afterAll(() => server.close());
  
  test("renders grid", async () => {
    const spyOnCreateData = jest.spyOn(utils, "createData");
    render(
      <ElementsProvider>
        <Categories />
        <TelicentGrid loading={false} />
      </ElementsProvider>
    );
    
    await user.click(await screen.findByRole("checkbox", { name: "Energy [25]" }));
    await waitFor(() => expect(spyOnCreateData).toHaveReturned());
    expect(screen.getByTestId("grid")).toMatchSnapshot();
  });
});

xdescribe("Grid should populate assets and connections", () => {
  describe("Assets should", () => {
    beforeEach(() => {
      render(
        <AssetProvider>
          <TelicentGrid assets={[assets[0]]} />
        </AssetProvider>
      );
    });

    it("populate first cell in row with asset id", () => {
      const buttons = screen.getAllByRole("button", { name: /fed/i });
      expect(buttons).toHaveLength(2);
    });

    it("show human readable name", () => {
      const cells = screen.getAllByRole("cell", { name: /fed/i });
      cells.forEach((cell) => {
        expect(cell).toHaveTextContent(/federal reserve/i);
      });
    });
  });

  describe("connections should", () => {
    beforeEach(() => {
      render(
        <AssetProvider>
          <TelicentGrid connections={connections} assets={assets} />
        </AssetProvider>
      );
    });

    it("show criticality for both connections in the grid.", () => {
      const buttons = screen.getAllByRole("button", { name: 3 });
      expect(buttons).toHaveLength(2);
    });
  });

  describe("when no data is passed grid should", () => {
    beforeEach(() => {
      render(
        <AssetProvider>
          <TelicentGrid />
        </AssetProvider>
      );
    });
    it("should not render any connections if none are passed", () => {
      const cells = screen.queryAllByRole("cell");
      const buttons = screen.queryAllByRole("button", { name: /3/ });
      expect(buttons).toHaveLength(0);
      expect(cells).toHaveLength(0);
    });
  });
});
