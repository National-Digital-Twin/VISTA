import { render, screen } from "@testing-library/react";
import React from "react";
import userEvent from "@testing-library/user-event";

import { createData } from "../DataFigures/utils";
import { E001, E001_E003, E003, E005, E005_E006, E006, E006_E012 } from "../../sample-data";
import { ElementsContext, ElementsProvider } from "../../context";
import SelectedElements from "./SelectedElements";

const assetsMetadata = [E001, E003, E005, E006];
const connectionsMetadata = [E001_E003, E006_E012, E005_E006];

const renderSelectedDetails = async () => {
  const data = await createData(assetsMetadata, connectionsMetadata);
  const { assets, connections, assetCriticalityColorScale, cxnCriticalityScale } = data;
  const selectedDetails = [
    assets[0].generateDetails(assets, assetCriticalityColorScale),
    assets[1].generateDetails(assets, assetCriticalityColorScale),
    connections[0].generateDetails(assets, cxnCriticalityScale),
  ];

  return {
    user: userEvent.setup(),
    ...render(
      <ElementsContext.Provider value={{ selectedDetails }}>
        <SelectedElements />
      </ElementsContext.Provider>
    ),
  };
};

describe("Selected Elements component", () => {
  test("renders message when an element(s) aren't selected", () => {
    render(<SelectedElements />, { wrapper: ElementsProvider });
    expect(
      screen.getByText(/click on an asset or connection to view details/i)
    ).toBeInTheDocument();
  });

  test("renders all selected elements", async () => {
    await renderSelectedDetails();

    expect(screen.getByRole("heading", { name: "3 Selected Elements" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(
      screen.getByRole("heading", { name: "East Cowes Power Station (E001)" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "East Cowes 132/33kV Substation (E003)" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "East Cowes Power Station (E001) to East Cowes 132/33kV Substation (E003)",
      })
    ).toBeInTheDocument();
  });

  test("renders element details when a list item is clicked", async () => {
    const { user } = await renderSelectedDetails();

    await user.click(screen.getByRole("button", { name: "East Cowes Power Station (E001) ies:Facility" }));

    expect(screen.getByTestId("element-details")).toBeInTheDocument();
  });

  test("renders all selected elements by click on back arrow", async () => {
    const { user } = await renderSelectedDetails();

    await user.click(screen.getByRole("button", { name: "East Cowes Power Station (E001) ies:Facility" }));
    expect(screen.getByTestId("element-details")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "view all selected" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(3);

    await user.click(screen.getByRole("button", { name: "East Cowes Power Station (E001) to East Cowes 132/33kV Substation (E003)" }));
    expect(screen.getByTestId("element-details")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "view all selected" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  })

  test("renders open street view link when an asset is selected", async () => {
    const { user } = await renderSelectedDetails();
    
    await user.click(screen.getByRole("button", { name: "East Cowes Power Station (E001) ies:Facility" }));
    expect(screen.getByTestId("element-details")).toBeInTheDocument();

    const viewpoint = encodeURIComponent(`${assetsMetadata[0].lat},${assetsMetadata[0].lon}`);
    expect(screen.getByRole("link", { name: /open street view/i })).toHaveAttribute(
      "href",
      `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${viewpoint}`
    );
  });
});
