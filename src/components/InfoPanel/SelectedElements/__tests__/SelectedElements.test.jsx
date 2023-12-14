import { screen } from "@testing-library/react";
import React from "react";
import { waitForElementToBeRemoved } from "@testing-library/dom";

import { ElementsProvider } from "context";
import {
  HIGH_VOLTAGE_ELECTRICITY_AND_OIL_FIRED_POWER_GENERATION_SUBSTATION_COMPLEX_DEPENDENCIES,
  HIGH_VOLTAGE_ELECTRICITY_SUBSTATION_COMPLEX_ASSETS,
  OIL_FIRED_POWER_GENERATION_COMPLEX_ASSETS,
} from "mocks";
import { getCreatedAssets, getCreatedDependencies, renderWithQueryClient } from "test-utils";

import SelectedElements from "../SelectedElements";

const renderSelectedDetails = (selected) =>
  renderWithQueryClient(
    <SelectedElements selectedElements={selected} onTogglePanel={jest.fn()} />,
    {
      wrapper: ElementsProvider,
    }
  );

const renderSelectedElementsList = async () => {
  const selectedAssets = await getCreatedAssets(
    [
      ...HIGH_VOLTAGE_ELECTRICITY_SUBSTATION_COMPLEX_ASSETS,
      ...OIL_FIRED_POWER_GENERATION_COMPLEX_ASSETS,
    ],
    ["E001", "E003"]
  );
  const selectedDependencies = getCreatedDependencies(
    HIGH_VOLTAGE_ELECTRICITY_AND_OIL_FIRED_POWER_GENERATION_SUBSTATION_COMPLEX_DEPENDENCIES,
    ["E001 - E003"]
  );
  return renderSelectedDetails([...selectedAssets, ...selectedDependencies]);
};

const waitForElementDetailsToLoad = async () => {
  await waitForElementToBeRemoved(() => screen.queryAllByText("Fetching element details"));
};

describe("Selected Elements component", () => {
  test("does NOT render component when selected elements are not an array", () => {
    renderSelectedDetails({});
    expect(document.querySelector("body").firstElementChild).toBeEmptyDOMElement();
  });

  test("renders message when an element(s) aren't selected", () => {
    renderSelectedDetails([]);

    expect(
      screen.getByText(/click on an asset or connection to view details/i)
    ).toBeInTheDocument();
  });

  test("does NOT render total selected when elements aren't selected", async () => {
    renderSelectedDetails([]);
    expect(screen.queryByTestId("selected-badge")).not.toBeInTheDocument();
  });

  test("renders total count of selected elements when panel in open", async () => {
    await renderSelectedElementsList();

    const selectedBadge = screen.getByTestId("selected-badge");
    expect(selectedBadge).toHaveTextContent("3");
  });

  test("renders total count when element is selected", async () => {
    const { user } = await renderSelectedElementsList();
    await waitForElementDetailsToLoad();
    await user.click(screen.getByRole("button", { name: "East Cowes Power Station" }));

    const selectedBadge = screen.getByTestId("selected-badge");
    expect(selectedBadge).toHaveTextContent("3");
  });

  test("renders a list of selected element details", async () => {
    await renderSelectedElementsList();

    expect(
      screen.getByRole("heading", { name: "Selected Elements", level: 2 })
    ).toBeInTheDocument();

    await waitForElementDetailsToLoad();
    expect(
      screen.getByRole("heading", { name: "East Cowes Power Station", level: 2 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "East Cowes 132/33kV Substation", level: 2 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "East Cowes Power Station - East Cowes 132/33kV Substation",
        level: 2,
      })
    ).toBeInTheDocument();
    expect(screen.queryAllByTestId("element-details")).toHaveLength(0);
    expect(screen.getByRole("list")).toMatchSnapshot("selected elements");
  });

  test("renders element details when a list item is clicked", async () => {
    const { user } = await renderSelectedElementsList();

    await waitForElementDetailsToLoad();
    await user.click(screen.getByRole("button", { name: "East Cowes Power Station" }));
    expect(screen.getByTestId("element-details")).toBeInTheDocument();
  });

  test("renders all selected elements by click on back arrow", async () => {
    const { user } = await renderSelectedElementsList();

    await waitForElementDetailsToLoad();
    await user.click(screen.getByRole("button", { name: "East Cowes Power Station" }));
    expect(screen.getByTestId("element-details")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "view all selected" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(3);

    await user.click(
      screen.getByRole("button", {
        name: "East Cowes Power Station - East Cowes 132/33kV Substation",
      })
    );
    expect(screen.getByTestId("element-details")).toBeInTheDocument();
  });

  test("renders open street view link when element has lat lng", async () => {
    const { user } = await renderSelectedElementsList();
    await waitForElementDetailsToLoad();

    await user.click(screen.getByRole("button", { name: "East Cowes Power Station" }));
    expect(screen.getByTestId("element-details")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open street view/i })).toHaveAttribute(
      "href",
      "https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=50.746912%2C-1.2862509"
    );
  });

  test("does NOT render street view link when element has no lat lng", async () => {
    const { user } = await renderSelectedElementsList();
    await waitForElementDetailsToLoad();

    await user.click(
      screen.getByRole("button", {
        name: "East Cowes Power Station - East Cowes 132/33kV Substation",
      })
    );
    expect(screen.getByTestId("element-details")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /open street view/i })).not.toBeInTheDocument();
  });

  test("renders element details when one element is selected", async () => {
    const selectedAssets = await getCreatedAssets(OIL_FIRED_POWER_GENERATION_COMPLEX_ASSETS, [
      "E001",
    ]);

    renderSelectedDetails(selectedAssets);
    await waitForElementDetailsToLoad();

    expect(screen.getByTestId("element-details")).toBeInTheDocument();
  });
});
