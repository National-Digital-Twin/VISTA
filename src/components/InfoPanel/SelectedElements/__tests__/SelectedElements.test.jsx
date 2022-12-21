import { render, screen, waitFor, waitForElementToBeRemoved } from "@testing-library/react";
import React from "react";

import * as utils from "components/Dataset/dataset-utils";
import { expandPanel, PanelProviders } from "test-utils";
import { ENERGY_ASSETS, LOW_ENERGY_VOLTAGE_ELECTRICITY_SUBSTATION_COMPLEX } from "mocks";
import { Asset, Dependency } from "models";

// import InfoPanel from "../../InfoPanel";
import SelectedElements from "../SelectedElements";

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

const expandInfoPanel = () => {
  window.localStorage.setItem("showInformationPanel", true);
};

describe("Selected Elements component", () => {
  test("renders message when an element(s) aren't selected", async () => {
    render(<SelectedElements />, { wrapper: PanelProviders });
    expandInfoPanel();

    expect(
      await screen.findByText(/click on an asset or connection to view details/i)
    ).toBeInTheDocument();
  });

  test.skip("renders all selected elements", async () => {
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

  test.skip("renders element details when a list item is clicked", async () => {
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

  test.skip("renders all selected elements by click on back arrow", async () => {
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

  test.skip("renders open street view link when an asset is selected", async () => {
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
    let selectedElements = LOW_ENERGY_VOLTAGE_ELECTRICITY_SUBSTATION_COMPLEX.filter(
      (asset) => asset.id === "E014"
    ).map((asset) => {
      return new Asset({
        uri: asset.uri,
        type: asset.type,
        lat: asset.lat,
        lng: asset.lon,
        geometry: [],
        dependent: {
          count: asset.dependentCount,
          criticalitySum: asset.dependentCriticalitySum,
        },
      });
    });

    const { rerender } = render(<SelectedElements selectedElements={selectedElements} />, {
      wrapper: PanelProviders,
    });
    expandInfoPanel();

    await waitForElementToBeRemoved(() => screen.queryByText(/Fetching element information/i));

    expect(
      screen.getByRole("heading", { name: "Sandown 33kV / 11kV Substation" })
    ).toBeInTheDocument();

    selectedElements = new Dependency({
      uri: "https://www.iow.gov.uk/DigitalTwin#_E014_E012_dependency",
      criticality: 3,
      dependent: {
        uri: "https://www.iow.gov.uk/DigitalTwin#E014",
        type: "http://ies.data.gov.uk/ontology/ies4#LowVoltageElectricitySubstationComplex",
      },
      provider: {
        uri: "https://www.iow.gov.uk/DigitalTwin#E012",
        type: "http://ies.data.gov.uk/ontology/ies4#LowVoltageElectricitySubstationComplex",
      },
      osmID: null,
    });
    rerender(<SelectedElements selectedElements={[selectedElements]} />);
    await waitForElementToBeRemoved(() => screen.getByText(/Fetching element information/i));

    expect(
      screen.getByRole("heading", {
        name: "Sandown 33kV / 11kV Substation - Ventnor 33kV / 11kV Substation",
      })
    ).toBeInTheDocument();
  });
});
