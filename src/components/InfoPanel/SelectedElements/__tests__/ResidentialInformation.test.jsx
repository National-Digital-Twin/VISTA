import { rest } from "msw";
import { screen, waitForElementToBeRemoved, within } from "@testing-library/react";

import { renderWithQueryClient } from "test-utils";
import { server } from "mocks";
import { createParalogEndpoint } from "endpoints";
import { V013_RESIDENCES } from "mocks/resolvers/person-residences";

import ResidentialInformation from "../ResidentialInformation";

const waitForResidencesToLoad = async () => {
  await waitForElementToBeRemoved(() => screen.queryByText("Fetching residential addresses"));
};

describe("Residential information component", () => {
  test("does NOT render when element is not an asset", () => {
    renderWithQueryClient(<ResidentialInformation isAsset={false} />);
    expect(document.querySelector("body").firstElementChild).toBeEmptyDOMElement();
  });

  test("does NOT render when primaryType is not defined", () => {
    renderWithQueryClient(
      <ResidentialInformation isAsset uri="https://www.iow.gov.uk/DigitalTwin%23V013" />
    );
    expect(document.querySelector("body").firstElementChild).toBeEmptyDOMElement();
  });

  test("does NOT render when uri is not defined", () => {
    renderWithQueryClient(<ResidentialInformation isAsset primaryType="Person" />);
    expect(document.querySelector("body").firstElementChild).toBeEmptyDOMElement();
  });

  test("does NOT render when primaryType is not person", () => {
    renderWithQueryClient(<ResidentialInformation isAsset primaryType="Road" />);
    expect(document.querySelector("body").firstElementChild).toBeEmptyDOMElement();
  });

  test("renders residences address", async () => {
    renderWithQueryClient(
      <ResidentialInformation
        isAsset
        primaryType="person"
        uri="https://www.iow.gov.uk/DigitalTwin%23V013"
      />
    );

    expect(
      screen.getByRole("heading", { name: "Residential Information", level: 3 })
    ).toBeInTheDocument();
    await waitForResidencesToLoad();

    const addresses = screen.getAllByRole("listitem");
    expect(addresses).toHaveLength(1);
    expect(within(addresses[0]).getByText("Address 1")).toBeInTheDocument();
    expect(
      within(addresses[0]).getByText("12 Afton Rd, Freshwater , PO40 9UH")
    ).toBeInTheDocument();
  });

  test("limits addresses displayed", async () => {
    server.use(
      rest.get(createParalogEndpoint("person/residences"), (req, res, ctx) => {
        const personUri = req.url.searchParams.get("personUri");
        if (personUri === "https://www.iow.gov.uk/DigitalTwin%23V013") {
          return res.once(
            ctx.status(200),
            ctx.json([
              ...V013_RESIDENCES,
              {
                uri: "https://www.iow.gov.uk/DigitalTwin#RT01",
                assetType: "http://ies.data.gov.uk/ontology/ies4#ResidentialBuilding",
                address: "1 Telicent Rd, Freshwater, TO01 ABC",
              },
              {
                uri: "https://www.iow.gov.uk/DigitalTwin#RT02",
                assetType: "http://ies.data.gov.uk/ontology/ies4#ResidentialBuilding",
                address: "2 Telicent Rd, Freshwater, T002 DEF",
              },
              {
                uri: "https://www.iow.gov.uk/DigitalTwin#RT03",
                assetType: "http://ies.data.gov.uk/ontology/ies4#ResidentialBuilding",
                address: "3 Telicent Rd, Freshwater, T003 GHI",
              },
            ])
          );
        }
      })
    );
    const { user } = renderWithQueryClient(
      <ResidentialInformation
        isAsset
        primaryType="person"
        uri="https://www.iow.gov.uk/DigitalTwin%23V013"
      />
    );
    expect(
      screen.getByRole("heading", { name: "Residential Information", level: 3 })
    ).toBeInTheDocument();
    await waitForResidencesToLoad();

    expect(screen.getByText("4 addresses found")).toBeInTheDocument();
    const showAllAddressesBtn = screen.getByRole("button", { name: "show all addresses" });
    expect(showAllAddressesBtn).toBeInTheDocument();

    let addresses = screen.getAllByRole("listitem");
    expect(addresses).toHaveLength(3);

    expect(within(addresses[0]).getByText("Address 1")).toBeInTheDocument();
    expect(
      within(addresses[0]).getByText("12 Afton Rd, Freshwater , PO40 9UH")
    ).toBeInTheDocument();

    expect(within(addresses[1]).getByText("Address 2")).toBeInTheDocument();
    expect(
      within(addresses[1]).getByText("1 Telicent Rd, Freshwater, TO01 ABC")
    ).toBeInTheDocument();

    expect(within(addresses[2]).getByText("Address 3")).toBeInTheDocument();
    expect(
      within(addresses[2]).getByText("2 Telicent Rd, Freshwater, T002 DEF")
    ).toBeInTheDocument();

    // show all addresses
    await user.click(showAllAddressesBtn);

    addresses = screen.getAllByRole("listitem");
    expect(addresses).toHaveLength(4);

    expect(within(addresses[3]).getByText("Address 4")).toBeInTheDocument();
    expect(
      within(addresses[3]).getByText("3 Telicent Rd, Freshwater, T003 GHI")
    ).toBeInTheDocument();

    // show less addresses
    await user.click(screen.getByRole("button", { name: "show less addresses" }));
    addresses = screen.getAllByRole("listitem");
    expect(addresses).toHaveLength(3);
  });

  test("renders error message when addresses cannot be found", async () => {
    renderWithQueryClient(
      <ResidentialInformation
        isAsset
        primaryType="person"
        uri="https://www.iow.gov.uk/TelicentTesting%23V013"
      />
    );

    expect(
      screen.getByRole("heading", { name: "Residential Information", level: 3 })
    ).toBeInTheDocument();
    await waitForResidencesToLoad();

    expect(
      screen.getByText("An error occured while retrieving residential information")
    ).toBeInTheDocument();
  });

  // Adding this test because currently the api does not return a 404 when an address cannot be found
  test("renders message when addresses are not found", async () => {
    server.use(
      rest.get(createParalogEndpoint("person/residences"), (req, res, ctx) => {
        const personUri = req.url.searchParams.get("personUri");
        if (personUri === "https://www.iow.gov.uk/DigitalTwin%23V013") {
          return res.once(ctx.status(200), ctx.json([]));
        }
      })
    );
    renderWithQueryClient(
      <ResidentialInformation
        isAsset
        primaryType="person"
        uri="https://www.iow.gov.uk/DigitalTwin%23V013"
      />
    );
    expect(
      screen.getByRole("heading", { name: "Residential Information", level: 3 })
    ).toBeInTheDocument();
    await waitForResidencesToLoad();

    expect(screen.getByText("Residential information not found")).toBeInTheDocument();
  });

  test("renders uri when address key is not in data", async () => {
    const data = { ...V013_RESIDENCES[0] };
    delete data.address;
    server.use(
      rest.get(createParalogEndpoint("person/residences"), (req, res, ctx) => {
        const personUri = req.url.searchParams.get("personUri");
        if (personUri === "https://www.iow.gov.uk/DigitalTwin%23V013") {
          return res.once(ctx.status(200), ctx.json([data]));
        }
      })
    );

    renderWithQueryClient(
      <ResidentialInformation
        isAsset
        primaryType="person"
        uri="https://www.iow.gov.uk/DigitalTwin%23V013"
      />
    );
    expect(
      screen.getByRole("heading", { name: "Residential Information", level: 3 })
    ).toBeInTheDocument();
    await waitForResidencesToLoad();

    let addresses = screen.getAllByRole("listitem");
    expect(addresses).toHaveLength(1);

    expect(within(addresses[0]).getByText("Address 1")).toBeInTheDocument();
    expect(
      within(addresses[0]).getByText("https://www.iow.gov.uk/DigitalTwin#R013")
    ).toBeInTheDocument();
  });
});
