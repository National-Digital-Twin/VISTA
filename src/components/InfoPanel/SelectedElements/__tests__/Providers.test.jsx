import React from "react";
import { screen, waitForElementToBeRemoved, within } from "@testing-library/dom";
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

import Providers from "../Providers";

const renderAssetProviders = async ({ assets, element }) => {
  return renderWithQueryClient(
    <ElementsContext.Provider value={{ assets }}>
      <Providers
        assetUri={element?.uri}
        provider={element?.provider}
        isAsset={isAsset(element)}
        isDependency={isDependency(element)}
      />
    </ElementsContext.Provider>
  );
};

const renderE003ProviderDetails = async (assets) => {
  const createdAssets = await getCreatedAssets(
    [
      ...HIGH_VOLTAGE_ELECTRICITY_SUBSTATION_COMPLEX_ASSETS,
      ...OIL_FIRED_POWER_GENERATION_COMPLEX_ASSETS,
    ],
    assets
  );
  const e003 = createdAssets.find((assets) => assets.id === "E003");
  return renderAssetProviders({ assets: createdAssets, element: e003 });
};

const waitForProvidersToLoad = async () => {
  await waitForElementToBeRemoved(() => screen.queryByText("Loading provider assets"));
};

const toggleProviders = async (user) => {
  await user.click(screen.getByRole("button", { name: /provider assets/i }));
};

describe("Providers component", () => {
  test("does NOT render provider assets when element is not defined", async () => {
    await renderE003ProviderDetails([]);
    expect(screen.queryByTestId("provider-assets")).not.toBeInTheDocument();
  });

  test("can toggle providers assets", async () => {
    const { user } = await renderE003ProviderDetails(["E003"]);
    await waitForProvidersToLoad();

    expect(
      screen.getByRole("heading", { name: "2 provider assets", level: 3 })
    ).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();

    await toggleProviders(user);
    expect(screen.getByRole("list")).toBeInTheDocument();

    const providers = screen.getAllByRole("listitem");
    expect(providers).toHaveLength(2);

    expect(
      within(providers[0]).getByRole("heading", { name: "Fawley 132 kV Substation - Hants" })
    ).toBeInTheDocument();
    expect(within(providers[0]).getByText("E025")).toBeInTheDocument();
    expect(within(providers[0]).getByTestId("asset-icon")).toHaveStyle({
      backgroundColor: "rgb(163, 163, 163)",
      color: "rgb(51, 51, 51)",
    });
    expect(within(providers[0]).getByTestId("asset-icon").firstElementChild).toHaveClass(
      "fa-solid fa-utility-pole-double"
    );

    expect(
      within(providers[1]).getByRole("heading", { name: "East Cowes Power Station" })
    ).toBeInTheDocument();
    expect(within(providers[1]).getByText("E001")).toBeInTheDocument();
    expect(within(providers[1]).getByTestId("asset-icon")).toHaveStyle({
      backgroundColor: "rgb(163, 163, 163)",
      color: "rgb(51, 51, 51)",
    });
    expect(within(providers[1]).getByTestId("asset-icon").firstElementChild).toHaveClass(
      "fa-regular fa-bolt-lightning"
    );
  });

  test("does NOT show providers when none are found", async () => {
    server.use(
      rest.get(createParalogEndpoint("asset/providers"), (req, res, ctx) => {
        const assetUri = req.url.searchParams.get("assetUri");
        if (assetUri === "https://www.iow.gov.uk/DigitalTwin#E003") {
          return res.once(ctx.status(200), ctx.json([]));
        }
      })
    );

    await renderE003ProviderDetails(["E003"]);
    await waitForProvidersToLoad();

    expect(screen.queryByTestId("provider-assets")).not.toBeInTheDocument();
  });

  test("renders error message when asset providers cannot be retrieved", async () => {
    server.use(
      rest.get(createParalogEndpoint("asset/providers"), (req, res, ctx) => {
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

    await renderE003ProviderDetails(["E001", "E003"]);
    await waitForProvidersToLoad();

    expect(
      screen.getByText("Failed to retrieve providers for https://www.iow.gov.uk/DigitalTwin#E003")
    ).toBeInTheDocument();
  });

  test("renders error message when one or more providers returns an error", async () => {
    server.use(
      rest.get(createParalogEndpoint("asset"), (req, res, ctx) => {
        const assetUri = req.url.searchParams.get("assetUri");
        if (assetUri === "https://www.iow.gov.uk/DigitalTwin#E001") {
          return res.once(
            ctx.status(404),
            ctx.json({
              message: "Asset information for https://www.iow.gov.uk/DigitalTwin#E001 not found",
            })
          );
        }
      })
    );

    const { user } = await renderE003ProviderDetails(["E001", "E003"]);
    await waitForProvidersToLoad();

    await toggleProviders(user);
    const providers = screen.getAllByRole("listitem");
    expect(providers).toHaveLength(2);

    expect(
      within(providers[1]).getByText(
        "Failed to retrieve asset information for https://www.iow.gov.uk/DigitalTwin#E001"
      )
    ).toBeInTheDocument();
    expect(providers).toMatchSnapshot("providers with error(s)");
  });
});
