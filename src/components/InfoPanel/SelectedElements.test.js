import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import userEvent from "@testing-library/user-event";
import { server } from "../../mocks/server";

import * as utils from "./../DataFigures/utils";
import { E001, E001_E003, E003, E005, E005_E006, E006, E006_E012 } from "../../sample-data";
import { ElementsContext, ElementsProvider } from "../../context";
import SelectedElements from "./SelectedElements";
import Categories from "../Categories/Categories";

const assetsMetadata = [E001, E003, E005, E006];
const connectionsMetadata = [E001_E003, E006_E012, E005_E006];

const AssetBtn = ({ label, assets, event, onElementClick }) => (
  <button
    onClick={() => {
      onElementClick(
        event,
        assets.find((asset) => asset.label === label)
      );
    }}
  >
    {label}
  </button>
);

const CxnBtn = ({ label, connections, event, onElementClick }) => (
  <button
    onClick={() => {
      onElementClick(
        event,
        connections.find((cxn) => cxn.label === label)
      );
    }}
  >
    {label}
  </button>
);

const renderSelectedDetails = () => {
  return {
    user: userEvent.setup(),
    ...render(
      <ElementsProvider>
        <ElementsContext.Consumer>
          {({ assets, connections, selectedElements, onElementClick }) => {
            const event = { originalEvent: { shiftKey: true } };
            return (
              <>
                <AssetBtn
                  label="E001"
                  assets={assets}
                  event={event}
                  onElementClick={onElementClick}
                />
                <AssetBtn
                  label="E003"
                  assets={assets}
                  event={event}
                  onElementClick={onElementClick}
                />
                <CxnBtn
                  label="E001 - E003"
                  connections={connections}
                  event={event}
                  onElementClick={onElementClick}
                />
                <div id="all-assets">
                  {assets.map((asset) => (
                    <p id="asset" key={asset.id}>
                      {asset.id}
                    </p>
                  ))}
                </div>
                <div id="all-connections">
                  {connections.map((cxn) => (
                    <p id="cxn" key={cxn.id}>
                      {cxn.id}
                    </p>
                  ))}
                </div>
                <div id="selected-elements">
                  {selectedElements.map((selectedElement) => (
                    <p id="selected-element" key={selectedElement.id}>
                      {selectedElement.id}
                    </p>
                  ))}
                </div>
                <Categories />
                <SelectedElements />
              </>
            );
          }}
        </ElementsContext.Consumer>
      </ElementsProvider>
    ),
  };
};

describe("Selected Elements component", () => {
  beforeAll(() => server.listen());
  beforeEach(() => {
    server.resetHandlers();
    jest.restoreAllMocks();
  });
  afterAll(() => server.close());

  test("renders message when an element(s) aren't selected", () => {
    render(<SelectedElements />, { wrapper: ElementsProvider });
    expect(
      screen.getByText(/click on an asset or connection to view details/i)
    ).toBeInTheDocument();
  });

  test("renders all selected elements", async () => {
    const spyOnCreateData = jest.spyOn(utils, "createData");
    const { user } = renderSelectedDetails();

    await waitFor(() =>
      expect(screen.getByRole("checkbox", { name: "Energy [25]" })).toBeInTheDocument()
    );
    await user.click(await screen.findByRole("checkbox", { name: "Energy [25]" }));
    expect(screen.getByRole("checkbox", { name: "Energy [25]" })).toBeChecked();
    await waitFor(() => expect(spyOnCreateData).toHaveReturned());

    await user.click(screen.getByRole("button", { name: "E001" }));
    await user.click(screen.getByRole("button", { name: "E003" }));
    await user.click(screen.getByRole("button", { name: "E001 - E003" }));
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
    const spyOnCreateData = jest.spyOn(utils, "createData");
    const { user } = renderSelectedDetails();

    await waitFor(() =>
      expect(screen.getByRole("checkbox", { name: "Energy [25]" })).toBeInTheDocument()
    );
    await user.click(await screen.findByRole("checkbox", { name: "Energy [25]" }));
    expect(screen.getByRole("checkbox", { name: "Energy [25]" })).toBeChecked();
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

    await waitFor(() =>
      expect(screen.getByRole("checkbox", { name: "Energy [25]" })).toBeInTheDocument()
    );
    await user.click(await screen.findByRole("checkbox", { name: "Energy [25]" }));
    expect(screen.getByRole("checkbox", { name: "Energy [25]" })).toBeChecked();
    await waitFor(() => expect(spyOnCreateData).toHaveReturned());

    await user.click(screen.getByRole("button", { name: "E001" }));
    await user.click(screen.getByRole("button", { name: "E003" }));
    await user.click(screen.getByRole("button", { name: "E001 - E003" }));

    await user.click(
      screen.getByRole("button", { name: "East Cowes Power Station (E001) ies:Facility" })
    );
    expect(screen.getByTestId("element-details")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "view all selected" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(3);

    await user.click(
      screen.getByRole("button", {
        name: "East Cowes Power Station (E001) to East Cowes 132/33kV Substation (E003)",
      })
    );
    expect(screen.getByTestId("element-details")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "view all selected" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  test("renders open street view link when an asset is selected", async () => {
    const spyOnCreateData = jest.spyOn(utils, "createData");
    const { user } = renderSelectedDetails();

    await waitFor(() =>
      expect(screen.getByRole("checkbox", { name: "Energy [25]" })).toBeInTheDocument()
    );
    await user.click(await screen.findByRole("checkbox", { name: "Energy [25]" }));
    expect(screen.getByRole("checkbox", { name: "Energy [25]" })).toBeChecked();
    await waitFor(() => expect(spyOnCreateData).toHaveReturned());

    await user.click(screen.getByRole("button", { name: "E001" }));
    await user.click(screen.getByRole("button", { name: "E003" }));

    await user.click(
      screen.getByRole("button", { name: "East Cowes Power Station (E001) ies:Facility" })
    );
    expect(screen.getByTestId("element-details")).toBeInTheDocument();

    const viewpoint = encodeURIComponent(`${assetsMetadata[0].lat},${assetsMetadata[0].lon}`);
    expect(screen.getByRole("link", { name: /open street view/i })).toHaveAttribute(
      "href",
      `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${viewpoint}`
    );
  });

  test("renders element details when an element is selected", async () => {
    const spyOnCreateData = jest.spyOn(utils, "createData");
    const { user } = renderSelectedDetails();

    await waitFor(() =>
      expect(screen.getByRole("checkbox", { name: "Energy [25]" })).toBeInTheDocument()
    );
    await user.click(await screen.findByRole("checkbox", { name: "Energy [25]" }));
    expect(screen.getByRole("checkbox", { name: "Energy [25]" })).toBeChecked();
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
