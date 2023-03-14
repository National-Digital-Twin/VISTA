import React from "react";
import { screen } from "@testing-library/react";

import { ElementsContext, ElementsProvider } from "context";
import { getCreatedAssets, renderWithQueryClient } from "test-utils";
import {
  HIGH_VOLTAGE_ELECTRICITY_SUBSTATION_COMPLEX_ASSETS,
  OIL_FIRED_POWER_GENERATION_COMPLEX_ASSETS,
} from "mocks";

import InfoPanel from "../InfoPanel";

describe("Information panel component", () => {
  test("is closed by default", () => {
    renderWithQueryClient(<InfoPanel />, { wrapper: ElementsProvider });

    expect(screen.getByRole("button", { name: /open information panel/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Information" })).not.toBeInTheDocument();
  });

  test("opens and closes", async () => {
    const { user } = renderWithQueryClient(<InfoPanel />, { wrapper: ElementsProvider });

    await user.click(screen.getByRole("button", { name: /open information panel/i }));
    expect(screen.getByRole("button", { name: /close information panel/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Information" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close information panel" }));
    expect(screen.getByRole("button", { name: /open information panel/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Information" })).not.toBeInTheDocument();
  });

  test("renders total count of selected elements when panel in closed", async () => {
    const assets = await getCreatedAssets(
      [
        ...HIGH_VOLTAGE_ELECTRICITY_SUBSTATION_COMPLEX_ASSETS,
        ...OIL_FIRED_POWER_GENERATION_COMPLEX_ASSETS,
      ],
      ["E001", "E003"]
    );
    renderWithQueryClient(
      <ElementsContext.Provider value={{ selectedElements: assets }}>
        <InfoPanel />
      </ElementsContext.Provider>
    );

    const selectedBadge = screen.getByTestId("selected-badge");
    expect(selectedBadge).toHaveTextContent("2");
  });
});
