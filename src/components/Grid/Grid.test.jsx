import { screen, render } from "@testing-library/react";
import { ElementsContext } from "../../context";
import { createData } from "../DataFigures/utils";
import TelicentGrid from "./index";
import { E001, E001_E003, E003, E005, E005_E006, E006, E006_E012 } from "../../sample-data";

const assets = [E001, E003, E005, E006];
const connections = [E001_E003, E006_E012, E005_E006];

describe("Grid component", () => {
  test("renders grid", async () => {
    const data = await createData(assets, connections);
    render(
      <ElementsContext.Provider value={{ data }}>
        <TelicentGrid loading={false} />
      </ElementsContext.Provider>
    );
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
