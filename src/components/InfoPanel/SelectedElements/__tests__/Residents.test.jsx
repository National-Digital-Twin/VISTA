import { screen, waitForElementToBeRemoved, within } from "@testing-library/react";
import { rest } from "msw";

import { server } from "mocks";
import { createParalogEndpoint } from "../../../../api/utils";
import { renderWithQueryClient } from "test-utils";
import { R013_RESIDENTS } from "mocks/resolvers/asset/residents";
import { mockEmptyResponse } from "mocks/resolvers";

import Residents from "../Residents";

const waitForResidentsToLoad = async () => {
  await waitForElementToBeRemoved(() => screen.queryByText("Fetching residents information"));
};

describe("Residents component", () => {
  test("does NOT render residents when elements is not an asset", () => {
    renderWithQueryClient(
      <Residents
        isAsset={false}
        assetUri="https://www.iow.gov.uk/DigitalTwin#R013"
        primaryType="ResidentialBuilding"
      />
    );
    expect(document.querySelector("body").firstElementChild).toBeEmptyDOMElement();
  });

  test("does NOT render residents when primaryType is undefined", () => {
    renderWithQueryClient(<Residents isAsset assetUri="https://www.iow.gov.uk/DigitalTwin#R013" />);
    expect(document.querySelector("body").firstElementChild).toBeEmptyDOMElement();
  });

  test("does NOT render residents when uri is undefined", () => {
    renderWithQueryClient(<Residents isAsset primaryType="ResidentialBuilding" />);
    expect(document.querySelector("body").firstElementChild).toBeEmptyDOMElement();
  });

  test("does NOT render residents when primary type has no residents", () => {
    renderWithQueryClient(<Residents isAsset primaryType="Road" />);
    expect(document.querySelector("body").firstElementChild).toBeEmptyDOMElement();
  });

  test("can be toggled", async () => {
    const { user } = renderWithQueryClient(
      <Residents
        isAsset
        assetUri="https://www.iow.gov.uk/DigitalTwin#R013"
        primaryType="ResidentialBuilding"
      />
    );
    await waitForResidentsToLoad();

    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "1 resident" }));
    expect(screen.getByRole("list")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "1 resident" }));
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  test("renders residents", async () => {
    const { user } = renderWithQueryClient(
      <Residents
        isAsset
        assetUri="https://www.iow.gov.uk/DigitalTwin#R013"
        primaryType="ResidentialBuilding"
      />
    );
    await waitForResidentsToLoad();

    expect(screen.getByRole("heading", { name: "1 resident", level: 3 })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "1 resident" }));

    const residents = screen.getAllByRole("listitem");
    expect(residents).toHaveLength(1);

    expect(within(residents[0]).getByText("Mrs Martha Mainwaring")).toBeInTheDocument();
  });

  test("renders more than one resident", async () => {
    server.use(
      rest.get(createParalogEndpoint("asset/residents"), (req, res, ctx) => {
        const assetUri = req.url.searchParams.get("assetUri");
        if (assetUri === "https://www.iow.gov.uk/DigitalTwin#R013") {
          return res.once(
            ctx.status(200),
            ctx.json([
              ...R013_RESIDENTS,
              {
                uri: "https://www.iow.gov.uk/Testing#V003",
                name: "Mr Jeffrey Berry",
              },
            ])
          );
        }
      })
    );

    const { user } = renderWithQueryClient(
      <Residents
        isAsset
        assetUri="https://www.iow.gov.uk/DigitalTwin#R013"
        primaryType="ResidentialBuilding"
      />
    );
    await waitForResidentsToLoad();

    expect(screen.getByRole("heading", { name: "2 residents", level: 3 })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "2 residents" }));

    const residents = screen.getAllByRole("listitem");
    expect(residents).toHaveLength(2);

    expect(within(residents[0]).getByText("Mrs Martha Mainwaring")).toBeInTheDocument();
    expect(within(residents[1]).getByText("Mr Jeffrey Berry")).toBeInTheDocument();
  });

  test("renders error message when resident(s) are not found", async () => {
    renderWithQueryClient(
      <Residents
        isAsset
        assetUri="https://www.iow.gov.uk/Testing#R013"
        primaryType="ResidentialBuilding"
      />
    );
    await waitForResidentsToLoad();
    expect(
      screen.getByText("Failed to retrieve residents for https://www.iow.gov.uk/Testing#R013")
    ).toBeInTheDocument();
  });

  // Adding this test because currently the api does not return a 404 when an address cannot be found
  test("does NOT render residents when none are found", async () => {
    server.use(rest.get(createParalogEndpoint("asset/residents"), mockEmptyResponse));
    renderWithQueryClient(
      <Residents
        isAsset
        assetUri="https://www.iow.gov.uk/DigitalTwin#R013"
        primaryType="ResidentialBuilding"
      />
    );
    await waitForResidentsToLoad();
    expect(document.querySelector("body").firstElementChild).toBeEmptyDOMElement();
  });

  test("renders uri resident when name is not in data", async () => {
    const data = { ...R013_RESIDENTS[0] };
    delete data.name;
    server.use(
      rest.get(createParalogEndpoint("asset/residents"), (req, res, ctx) => {
        const assetUri = req.url.searchParams.get("assetUri");
        if (assetUri === "https://www.iow.gov.uk/DigitalTwin#R013") {
          return res.once(ctx.status(200), ctx.json([data]));
        }
      })
    );

    const { user } = renderWithQueryClient(
      <Residents
        isAsset
        assetUri="https://www.iow.gov.uk/DigitalTwin#R013"
        primaryType="ResidentialBuilding"
      />
    );
    await waitForResidentsToLoad();
    await user.click(screen.getByRole("button", { name: "1 resident" }));

    const residents = screen.getAllByRole("listitem");
    expect(residents).toHaveLength(1);

    expect(
      within(residents[0]).getByText("https://www.iow.gov.uk/DigitalTwin#V013")
    ).toBeInTheDocument();
  });
});
