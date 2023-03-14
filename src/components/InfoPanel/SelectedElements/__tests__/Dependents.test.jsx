import React from "react";
import { screen, waitForElementToBeRemoved, within } from "@testing-library/react";
import { rest } from "msw";

import { ElementsContext } from "context";
import { createParalogEndpoint } from "endpoints";
import {
  HIGH_VOLTAGE_ELECTRICITY_SUBSTATION_COMPLEX_ASSETS,
  OIL_FIRED_POWER_GENERATION_COMPLEX_ASSETS,
  server,
} from "mocks";
import { getCreatedAssets, renderWithQueryClient } from "test-utils";
import { isAsset, isDependency } from "utils";

import Dependents from "../Dependents";

const renderAssetDependents = async ({ assets, element }) =>
  renderWithQueryClient(
    <ElementsContext.Provider value={{ assets }}>
      <Dependents
        assetUri={element?.uri}
        dependent={element?.dependent}
        isAsset={isAsset(element)}
        isDependency={isDependency(element)}
      />
    </ElementsContext.Provider>
  );

const renderE003AssetDetails = async (assets) => {
  const createdAssets = await getCreatedAssets(
    [
      ...HIGH_VOLTAGE_ELECTRICITY_SUBSTATION_COMPLEX_ASSETS,
      ...OIL_FIRED_POWER_GENERATION_COMPLEX_ASSETS,
    ],
    assets
  );
  const e003 = createdAssets.find((assets) => assets.id === "E003");
  return renderAssetDependents({ assets: createdAssets, element: e003 });
};

const waitForDependentsToLoad = async () => {
  await waitForElementToBeRemoved(() => screen.queryByText("Loading dependent assets"));
};

const toggleDependents = async (user) => {
  await user.click(screen.getByRole("button", { name: /dependent assets/i }));
};

describe("Dependents component", () => {
  test("does NOT render dependent assets when element is not defined", async () => {
    await renderE003AssetDetails([]);
    expect(screen.queryByTestId("dependent-assets")).not.toBeInTheDocument();
  });

  test("can toggle dependents assets", async () => {
    const { user } = await renderE003AssetDetails(["E003"]);
    await waitForDependentsToLoad();

    expect(
      screen.getByRole("heading", { name: "4 dependent assets", level: 3 })
    ).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();

    await toggleDependents(user);
    expect(screen.queryByRole("list")).toBeInTheDocument();

    const dependents = screen.getAllByRole("listitem");
    expect(dependents).toHaveLength(4);

    expect(
      within(dependents[0]).getByRole("heading", { name: "Shalfleet 33kV / 11kV Substation" })
    ).toBeInTheDocument();
    expect(within(dependents[0]).getByText("E008")).toBeInTheDocument();
    expect(within(dependents[0]).getByTestId("asset-icon")).toHaveStyle({
      backgroundColor: "rgb(163, 163, 163)",
      color: "rgb(51, 51, 51)",
    });
    expect(within(dependents[0]).getByTestId("asset-icon").firstElementChild).toHaveTextContent(
      "Low"
    );

    expect(
      within(dependents[3]).getByRole("heading", { name: "East Cowes Power Station" })
    ).toBeInTheDocument();
    expect(within(dependents[3]).getByText("E001")).toBeInTheDocument();
    expect(within(dependents[3]).getByTestId("asset-icon")).toHaveStyle({
      backgroundColor: "rgb(163, 163, 163)",
      color: "rgb(51, 51, 51)",
    });
    expect(within(dependents[3]).getByTestId("asset-icon").firstElementChild).toHaveClass(
      "fa-regular fa-bolt-lightning"
    );

    expect(dependents).toMatchSnapshot("dependents not sorted");
  });

  test("does NOT show dependents when none are found", async () => {
    server.use(
      rest.get(createParalogEndpoint("asset/dependents"), (req, res, ctx) => {
        const assetUri = req.url.searchParams.get("assetUri");
        if (assetUri === "https://www.iow.gov.uk/DigitalTwin#E003") {
          return res.once(ctx.status(200), ctx.json([]));
        }
      })
    );

    await renderE003AssetDetails(["E001", "E003"]);
    await waitForDependentsToLoad();

    expect(screen.queryByTestId("dependent-assets")).not.toBeInTheDocument();
  });

  test("renders error message when asset dependents cannot be retrieved", async () => {
    server.use(
      rest.get(createParalogEndpoint("asset/dependents"), (req, res, ctx) => {
        const assetUri = req.url.searchParams.get("assetUri");
        if (assetUri === "https://www.iow.gov.uk/DigitalTwin#E003") {
          return res.once(
            ctx.status(404),
            ctx.json({
              message: "Depedents for https://www.iow.gov.uk/DigitalTwin#E003 not found",
            })
          );
        }
      })
    );

    await renderE003AssetDetails(["E001", "E003"]);
    await waitForDependentsToLoad();

    expect(
      screen.getByText("Failed to retrieve dependents for https://www.iow.gov.uk/DigitalTwin#E003")
    ).toBeInTheDocument();
  });

  test("renders error message when one or more dependents returns an error", async () => {
    server.use(
      rest.get(createParalogEndpoint("asset"), (req, res, ctx) => {
        const assetUri = req.url.searchParams.get("assetUri");
        if (assetUri === "https://www.iow.gov.uk/DigitalTwin#E002") {
          return res.once(
            ctx.status(404),
            ctx.json({
              message: "Asset information for https://www.iow.gov.uk/DigitalTwin#E002 not found",
            })
          );
        }
      })
    );

    const { user } = await renderE003AssetDetails(["E001", "E003"]);
    await waitForDependentsToLoad();

    await toggleDependents(user);
    const dependents = screen.getAllByRole("listitem");
    expect(dependents).toHaveLength(4);

    expect(
      within(dependents[2]).getByText(
        "Failed to retrieve asset information for https://www.iow.gov.uk/DigitalTwin#E002"
      )
    ).toBeInTheDocument();
    expect(dependents).toMatchSnapshot("dependents with error(s)");
  });
});
