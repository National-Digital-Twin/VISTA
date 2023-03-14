import React from "react";
import { screen, waitForElementToBeRemoved, within } from "@testing-library/react";

import { ElementsProvider } from "context";
import {
  HIGH_VOLTAGE_ELECTRICITY_AND_OIL_FIRED_POWER_GENERATION_SUBSTATION_COMPLEX_DEPENDENCIES,
  HIGH_VOLTAGE_ELECTRICITY_SUBSTATION_COMPLEX_ASSETS,
  OIL_FIRED_POWER_GENERATION_COMPLEX_ASSETS,
} from "mocks";
import { getCreatedAssets, getCreatedDependencies, renderWithQueryClient } from "test-utils";
import { createAssets } from "components/Dataset/dataset-utils";

import ElementDetails from "../ElementDetails";

const renderElementDetails = ({ element, expand }) =>
  renderWithQueryClient(
    <ElementDetails element={element} expand={expand} onViewDetails={jest.fn()} />,
    { wrapper: ElementsProvider }
  );

const waitForDetailsToLoad = async () => {
  await waitForElementToBeRemoved(() => screen.queryByText("Fetching element details"));
};

const renderAssetDetails = async ({ assets, ids, expand }) => {
  const createdAssets = await getCreatedAssets(assets, ids);
  return renderElementDetails({ element: createdAssets[0], expand });
};

const renderConnectionDetails = ({ dependencies, ids, expand }) => {
  const createdDependencies = getCreatedDependencies(dependencies, ids);
  renderElementDetails({ element: createdDependencies[0], expand });
};

const renderAndLoadE001Details = async () => {
  await renderAssetDetails({
    assets: OIL_FIRED_POWER_GENERATION_COMPLEX_ASSETS,
    ids: ["E001"],
    expand: true,
  });
  await waitForDetailsToLoad();
};

const renderAndLoadE003Details = async () => {
  await renderAssetDetails({
    assets: HIGH_VOLTAGE_ELECTRICITY_SUBSTATION_COMPLEX_ASSETS,
    ids: ["E003"],
    expand: true,
  });
  await waitForDetailsToLoad();
};

const renderAndLoadE001toE003ConnectionDetails = async () => {
  renderConnectionDetails({
    dependencies:
      HIGH_VOLTAGE_ELECTRICITY_AND_OIL_FIRED_POWER_GENERATION_SUBSTATION_COMPLEX_DEPENDENCIES,
    ids: ["E001 - E003"],
    expand: true,
  });
  await waitForDetailsToLoad();
};

describe("Element details component", () => {
  test("renders asset icon label when styles are not defined", async () => {
    await renderAssetDetails({
      assets: OIL_FIRED_POWER_GENERATION_COMPLEX_ASSETS,
      ids: ["E001"],
      expand: false,
    });
    await waitForDetailsToLoad();

    const assetIcon = screen.getByTestId("asset-icon");
    expect(within(assetIcon).getByText("Oil")).toBeInTheDocument();
  });

  test("renders asset icon", async () => {
    const mockGetIconStyle = jest.fn().mockReturnValue({
      backgroundColor: "#FFFF00",
      color: "black",
      icon: "ri-cloudy-fill",
      faIcon: "fa-regular fa-bolt-lightning",
      faUnicode: "",
      faClass: "fa-regular",
    });
    const createdAssets = (
      await createAssets(OIL_FIRED_POWER_GENERATION_COMPLEX_ASSETS, mockGetIconStyle, jest.fn())
    ).filter((asset) => asset.id === "E001");

    renderElementDetails({ element: createdAssets[0], expand: true });
    await waitForDetailsToLoad();

    const assetIcon = screen.getByTestId("asset-icon");
    expect(assetIcon).toHaveStyle({
      backgroundColor: "rgb(255, 255, 0)",
      color: "black",
      border: "3px solid #f2f2f2",
    });
    expect(assetIcon.firstElementChild).toHaveClass("fa-regular fa-bolt-lightning");

    // checks dependents are loaded
    expect(await screen.findByRole("heading", { name: "1 dependent asset" })).toBeInTheDocument();

    // checks providers are loaded
    expect(await screen.findByRole("heading", { name: "1 provider asset" })).toBeInTheDocument();
  });

  test("renders summarised asset details", async () => {
    await renderAssetDetails({
      assets: OIL_FIRED_POWER_GENERATION_COMPLEX_ASSETS,
      ids: ["E001"],
      expand: false,
    });
    await waitForDetailsToLoad();

    // checks asset name is present
    expect(screen.getByRole("heading", { name: "East Cowes Power Station" })).toBeInTheDocument();

    // checks asset type is present
    expect(screen.getByText("oil fired power generation complex")).toBeInTheDocument();

    // checks asset ID is present
    expect(screen.getByText("E001")).toBeInTheDocument();

    // checks asset criticality is not present
    expect(screen.queryByText("Criticality: 3")).not.toBeInTheDocument();

    // check description is not rendered
    expect(screen.queryByTestId("description")).not.toBeInTheDocument();

    // checks dependents are not present
    expect(screen.queryByRole("heading", { name: "1 dependent asset" })).not.toBeInTheDocument();

    // checks providers are not present
    expect(screen.queryByRole("heading", { name: "1 provider asset" })).not.toBeInTheDocument();
  });

  test("renders summarised connection details", async () => {
    renderConnectionDetails({
      dependencies:
        HIGH_VOLTAGE_ELECTRICITY_AND_OIL_FIRED_POWER_GENERATION_SUBSTATION_COMPLEX_DEPENDENCIES,
      ids: ["E001 - E003"],
      expand: false,
    });
    await waitForDetailsToLoad();

    // checks connection name is present
    expect(
      screen.getByRole("heading", {
        name: "East Cowes Power Station - East Cowes 132/33kV Substation",
      })
    ).toBeInTheDocument();

    // checks connection ID is present
    expect(screen.getByText("E001 - E003")).toBeInTheDocument();

    // checks asset criticality is not present
    expect(screen.queryByText("Criticality: 3")).not.toBeInTheDocument();

    // checks dependents are not present
    expect(screen.queryByRole("heading", { name: "1 dependent asset" })).not.toBeInTheDocument();

    // checks providers are not present
    expect(screen.queryByRole("heading", { name: "1 provider asset" })).not.toBeInTheDocument();
  });

  test("renders asset details", async () => {
    await renderAndLoadE001Details();

    // checks asset name is present
    expect(screen.getByRole("heading", { name: "East Cowes Power Station" })).toBeInTheDocument();

    // checks asset type is present
    expect(screen.getByText("oil fired power generation complex")).toBeInTheDocument();

    // checks asset ID is present
    expect(screen.getByText("E001")).toBeInTheDocument();

    // checks asset criticality is present
    expect(screen.getByText("Criticality: 3")).toBeInTheDocument();

    // checks asset description is present
    expect(screen.getByTestId("description")).toHaveTextContent(
      "Cowes power station (or Kingston power station) is a 140MW Open Cycle Gas Turbine station powered by two 70MW units. The station is the Isle of Wight's only conventional power generation source other than power from the mainland. The station was built in 1982 at a cost of ï¿½30 million. The station is owned and operated by RWE Generation UK."
    );

    // checks dependents are loaded
    expect(await screen.findByRole("heading", { name: "1 dependent asset" })).toBeInTheDocument();

    // checks providers are loaded
    expect(await screen.findByRole("heading", { name: "1 provider asset" })).toBeInTheDocument();
  });

  test("does NOT render description when asset doesn't have description", async () => {
    await renderAndLoadE003Details();

    // checks asset name is present
    expect(
      screen.getByRole("heading", { name: "East Cowes 132/33kV Substation" })
    ).toBeInTheDocument();

    // check description is not rendered
    expect(screen.queryByTestId("description")).not.toBeInTheDocument();

    // checks dependents are loaded
    expect(await screen.findByRole("heading", { name: "4 dependent assets" })).toBeInTheDocument();

    // checks providers are loaded
    expect(await screen.findByRole("heading", { name: "2 provider assets" })).toBeInTheDocument();
  });

  test("renders connection details", async () => {
    await renderAndLoadE001toE003ConnectionDetails();

    // checks connection name is present
    expect(
      screen.getByRole("heading", {
        name: "East Cowes Power Station - East Cowes 132/33kV Substation",
      })
    ).toBeInTheDocument();

    // checks connection ID is present
    expect(screen.getByText("E001 - E003")).toBeInTheDocument();

    // checks asset criticality is present
    expect(screen.getByText("Criticality: 3")).toBeInTheDocument();

    // checks dependents are loaded
    expect(await screen.findByRole("heading", { name: "1 dependent asset" })).toBeInTheDocument();

    // checks providers are loaded
    expect(await screen.findByRole("heading", { name: "1 provider asset" })).toBeInTheDocument();
  });

  test("renders error message when details are not found", async () => {
    const uri = "https://www.iow.gov.uk/ReactTests#E001";
    await renderAssetDetails({ assets: [{ uri }], ids: ["E001"], expand: true });
    await waitForDetailsToLoad();
    expect(
      screen.getByText(`An error has occured while fetching information for ${uri}`)
    ).toBeInTheDocument();
  });

  test("render error message when an element in not provided", async () => {
    renderElementDetails({ expand: true });
    expect(
      screen.getByText("Unable to retrieve details for unknown element or details not found")
    ).toBeInTheDocument();
  });
});
