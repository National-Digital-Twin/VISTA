import { screen, render } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import DataFigures from ".";
import AssetProvider from "../AssetContext";
import ElementsProvider from "../ElementsContext";

describe("DataFigures should", () => {
  it("call api for assessments of selected criteria", async () => {
    await act(async () => {
      await render(
        <ElementsProvider>
          <AssetProvider>
            <DataFigures />
          </AssetProvider>
        </ElementsProvider>
      );
    });

    screen.debug();
  });
});
