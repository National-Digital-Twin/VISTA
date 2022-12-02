import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

import * as utils from "../../Dataset/dataset-utils";
import { AssetBtn, clickEnergyDataset, CxnBtn, expandPanel, renderTestComponent } from "../../../test-utils";
import { ENERGY_ASSETS } from "../../../mocks";
import InfoPanel from "../InfoPanel";

const TestBtns = ({ assets, connections, onElementClick }) => {
  const event = { originalEvent: { shiftKey: true } };
  return (
    <>
      <AssetBtn label="E001" assets={assets} event={event} onElementClick={onElementClick} />
      <AssetBtn label="E003" assets={assets} event={event} onElementClick={onElementClick} />
      <CxnBtn
        label="E001 - E003"
        connections={connections}
        event={event}
        onElementClick={onElementClick}
      />
    </>
  );
};

const renderSelectedDetails = () => renderTestComponent(<InfoPanel />, { testComponent: TestBtns });

describe("Selected Elements component", () => {
  test("renders message when an element(s) aren't selected", async () => {
    const { user } = renderTestComponent(<InfoPanel />);
    await expandPanel(user);

    expect(
      await screen.findByText(/click on an asset or connection to view details/i)
    ).toBeInTheDocument();
  });

  test("renders all selected elements", async () => {
    const spyOnCreateData = jest.spyOn(utils, "createData");
    const { user } = renderSelectedDetails();

    await expandPanel(user);
    await clickEnergyDataset(user);
    await waitFor(() => expect(spyOnCreateData).toHaveReturned());

    await user.click(screen.getByRole("button", { name: "E001" }));
    await user.click(screen.getByRole("button", { name: "E003" }));
    await user.click(screen.getByRole("button", { name: "E001 - E003" }));
    expect(screen.getByRole("heading", { name: "Selected Elements" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(6);
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
    const spyOnCreateData = jest.spyOn(utils, "createData");
    const { user } = renderSelectedDetails();

    await expandPanel(user);
    await clickEnergyDataset(user);
    await waitFor(() => expect(spyOnCreateData).toHaveReturned());

    await user.click(screen.getByRole("button", { name: "E001" }));
    await user.click(screen.getByRole("button", { name: "E003" }));
    await user.click(screen.getByRole("button", { name: "E001 - E003" }));

    await user.click(
      screen.getByRole("button", { name: "East Cowes Power Station (E001) ies:Facility" })
    );

    expect(screen.getByTestId("element-details")).toBeInTheDocument();
  });

  test("renders all selected elements by click on back arrow", async () => {
    const spyOnCreateData = jest.spyOn(utils, "createData");
    const { user } = renderSelectedDetails();

    await expandPanel(user);
    await clickEnergyDataset(user);
    await waitFor(() => expect(spyOnCreateData).toHaveReturned());

    await user.click(screen.getByRole("button", { name: "E001" }));
    await user.click(screen.getByRole("button", { name: "E003" }));
    await user.click(screen.getByRole("button", { name: "E001 - E003" }));

    await user.click(
      screen.getByRole("button", { name: "East Cowes Power Station (E001) ies:Facility" })
    );
    expect(screen.getByTestId("element-details")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "view all selected" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(6);

    await user.click(
      screen.getByRole("button", {
        name: "East Cowes Power Station (E001) to East Cowes 132/33kV Substation (E003)",
      })
    );
    expect(screen.getByTestId("element-details")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "view all selected" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(6);
  });

  test("renders open street view link when an asset is selected", async () => {
    const spyOnCreateData = jest.spyOn(utils, "createData");
    const { user } = renderSelectedDetails();

    await expandPanel(user);
    await clickEnergyDataset(user);
    await waitFor(() => expect(spyOnCreateData).toHaveReturned());

    await user.click(screen.getByRole("button", { name: "E001" }));
    await user.click(screen.getByRole("button", { name: "E003" }));

    await user.click(
      screen.getByRole("button", { name: "East Cowes Power Station (E001) ies:Facility" })
    );
    expect(screen.getByTestId("element-details")).toBeInTheDocument();

    const viewpoint = encodeURIComponent(`${ENERGY_ASSETS[0].lat},${ENERGY_ASSETS[0].lon}`);
    expect(screen.getByRole("link", { name: /open street view/i })).toHaveAttribute(
      "href",
      `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${viewpoint}`
    );
  });

  test("renders element details when an element is selected", async () => {
    const spyOnCreateData = jest.spyOn(utils, "createData");
    const { user } = renderSelectedDetails();

    await expandPanel(user);
    await clickEnergyDataset(user);
    await waitFor(() => expect(spyOnCreateData).toHaveReturned());

    await user.click(screen.getByRole("button", { name: "E001" }));
    expect(
      screen.getByRole("heading", { name: "East Cowes Power Station (E001)" })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "E001 - E003" }));
    expect(
      screen.getByRole("heading", {
        name: "East Cowes Power Station (E001) to East Cowes 132/33kV Substation (E003)",
      })
    ).toBeInTheDocument();
  });
});
