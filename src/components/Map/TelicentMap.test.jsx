import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import userEvent from "@testing-library/user-event";
import { CytoscapeProvider, ElementsContext, ElementsProvider } from "../../context";
import { server } from "../../mocks/server";
import TelicentMap from "./TelicentMap";
import Categories from "./../Categories/Categories";
import * as mapboxFeatures from "./mapboxFeatures";
import * as utils from "./../DataFigures/utils";

jest.mock("react-map-gl", () => ({
  __esModule: true,
  default: ({ children }) => <div id="telicentMap">{children}</div>,
  Source: ({ props, children }) => (
    <div {...props}>
      {props}
      {children}
    </div>
  ),
  Layer: (props) => <div {...props}></div>,
  MapProvider: ({ children }) => <div>{children}</div>,
  useMap: () =>
    jest.fn().mockReturnValue({
      telicentMap: { zoomIn: jest.fn(), zoomOut: jest.fn() },
    }),
}));

const user = userEvent.setup();

describe("Map component", () => {
  beforeAll(() => server.listen());
  beforeEach(() => {
    server.resetHandlers();
    jest.restoreAllMocks();
  });
  afterAll(() => server.close());

  test("generates selected all assets", async () => {
    const spyOnCreateData = jest.spyOn(utils, "createData");
    const spyOnGenerateAssetFeatures = jest.spyOn(mapboxFeatures, "generateAssetFeatures");
    render(
      <CytoscapeProvider>
        <ElementsProvider>
          <Categories />
          <TelicentMap />
        </ElementsProvider>
      </CytoscapeProvider>
    );

    await waitFor(() =>
      expect(screen.getByRole("checkbox", { name: "Energy [25]" })).toBeInTheDocument()
    );
    await user.click(await screen.findByRole("checkbox", { name: "Energy [25]" }));
    expect(screen.getByRole("checkbox", { name: "Energy [25]" })).toBeChecked();
    await waitFor(() => expect(spyOnCreateData).toHaveReturned());

    expect(spyOnGenerateAssetFeatures).toHaveReturned();
  });

  test("generates selected assets", async () => {
    const spyOnCreateData = jest.spyOn(utils, "createData");
    const spyOnCreateSelectedAssetFeatures = jest.spyOn(
      mapboxFeatures,
      "createSelectedAssetFeatures"
    );
    render(
      <CytoscapeProvider>
        <ElementsProvider>
          <ElementsContext.Consumer>
            {({ assets, onElementClick }) => {
              const event = {
                originalEvent: { shiftKey: false },
              };
              return (
                <>
                  <button
                    onClick={() => {
                      onElementClick(
                        event,
                        assets.find((asset) => asset.label === "E005")
                      );
                    }}
                  >
                    E005
                  </button>
                  <div id="all-assets">
                    {assets.map((asset) => (
                      <p id="asset" key={asset.id}>
                        {asset.id}
                      </p>
                    ))}
                  </div>
                  <Categories />
                  <TelicentMap />
                </>
              );
            }}
          </ElementsContext.Consumer>
        </ElementsProvider>
      </CytoscapeProvider>
    );

    await waitFor(() =>
      expect(screen.getByRole("checkbox", { name: "Energy [25]" })).toBeInTheDocument()
    );
    await user.click(await screen.findByRole("checkbox", { name: "Energy [25]" }));
    expect(screen.getByRole("checkbox", { name: "Energy [25]" })).toBeChecked();
    await waitFor(() => expect(spyOnCreateData).toHaveReturned());

    expect(screen.getAllByTestId("asset")).toHaveLength(5);
    expect(spyOnCreateSelectedAssetFeatures).toHaveBeenCalledTimes(3);
    expect(spyOnCreateSelectedAssetFeatures).toHaveReturnedWith([]);

    await user.click(screen.getByRole("button", { name: "E005" }));
    expect(spyOnCreateSelectedAssetFeatures).toHaveBeenCalledTimes(4);
    expect(spyOnCreateSelectedAssetFeatures).toHaveReturned();
  });

  test("renders medical selected elements when energy dataset is deselected", async () => {
    const spyOnCreateData = jest.spyOn(utils, "createData");
    render(
      <CytoscapeProvider>
        <ElementsProvider>
          <ElementsContext.Consumer>
            {({ assets, selectedElements, onElementClick }) => {
              const event = {
                originalEvent: { shiftKey: true },
              };
              return (
                <>
                  <button
                    onClick={() => {
                      onElementClick(
                        event,
                        assets.find((asset) => asset.label === "E012")
                      );
                    }}
                  >
                    E012
                  </button>
                  <button
                    onClick={() => {
                      onElementClick(
                        event,
                        assets.find((asset) => asset.label === "M022")
                      );
                    }}
                  >
                    M022
                  </button>
                  <button
                    onClick={() => {
                      onElementClick(
                        event,
                        assets.find((asset) => asset.label === "M023")
                      );
                    }}
                  >
                    M023
                  </button>
                  <div id="selected-elements">
                    {selectedElements.map((selectedElement) => (
                      <p id="selected-element" key={selectedElement.id}>
                        {selectedElement.id}
                      </p>
                    ))}
                  </div>
                  <Categories />
                  <TelicentMap />
                </>
              );
            }}
          </ElementsContext.Consumer>
        </ElementsProvider>
      </CytoscapeProvider>
    );
    await user.click(await screen.findByRole("checkbox", { name: "Energy [25]" }));
    await user.click(await screen.findByRole("checkbox", { name: "Medical [32]" }));
    expect(screen.getByRole("checkbox", { name: "Energy [25]" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Medical [32]" })).toBeChecked();
    await waitFor(() => expect(spyOnCreateData).toHaveReturned());

    await user.click(screen.getByRole("button", { name: "E012" }));
    await user.click(screen.getByRole("button", { name: "M022" }));
    await user.click(screen.getByRole("button", { name: "M023" }));
    expect(screen.getAllByTestId("selected-element")).toHaveLength(3);

    await user.click(screen.getByRole("checkbox", { name: "Energy [25]" }));
    await waitFor(() => expect(screen.getAllByTestId("selected-element")).toHaveLength(2));
    expect(screen.getByText("http://telicent.io/fake_data#M022")).toBeInTheDocument();
    expect(screen.getByText("http://telicent.io/fake_data#M023")).toBeInTheDocument();
  });

  test("idk yet", async () => {
    const spyOnCreateData = jest.spyOn(utils, "createData");
    render(
      <CytoscapeProvider>
        <ElementsProvider>
          <ElementsContext.Consumer>
            {({ assets, selectedElements, onElementClick }) => {
              const event = {
                originalEvent: { shiftKey: true },
              };
              return (
                <>
                  <button
                    onClick={() => {
                      onElementClick(
                        event,
                        assets.find((asset) => asset.label === "E012")
                      );
                    }}
                  >
                    E012
                  </button>
                  <button
                    onClick={() => {
                      onElementClick(
                        event,
                        assets.find((asset) => asset.label === "M022")
                      );
                    }}
                  >
                    M022
                  </button>
                  <button
                    onClick={() => {
                      onElementClick(
                        event,
                        assets.find((asset) => asset.label === "M023")
                      );
                    }}
                  >
                    M023
                  </button>
                  <div id="selected-elements">
                    {selectedElements.map((selectedElement) => (
                      <p id="selected-element" key={selectedElement.id}>
                        {selectedElement.id}
                      </p>
                    ))}
                  </div>
                  <Categories />
                  <TelicentMap />
                </>
              );
            }}
          </ElementsContext.Consumer>
        </ElementsProvider>
      </CytoscapeProvider>
    );
    await user.click(await screen.findByRole("checkbox", { name: "Energy [25]" }));
    await user.click(await screen.findByRole("checkbox", { name: "Medical [32]" }));
    expect(screen.getByRole("checkbox", { name: "Energy [25]" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Medical [32]" })).toBeChecked();
    await waitFor(() => expect(spyOnCreateData).toHaveReturned());

    await user.click(screen.getByRole("button", { name: "E012" }));
    expect(screen.getAllByTestId("selected-element")).toHaveLength(1);
    expect(screen.getByText("http://telicent.io/fake_data#E012")).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "Energy [25]" }));
    await waitFor(() => expect(screen.queryAllByTestId("selected-element")).toHaveLength(0));
    expect(screen.queryByText("http://telicent.io/fake_data#E012")).not.toBeInTheDocument();
  });
});
