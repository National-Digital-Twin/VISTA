import { render, screen, waitFor, within } from "@testing-library/react";
import React from "react";
import userEvent from "@testing-library/user-event";
import { CytoscapeProvider, ElementsContext, ElementsProvider } from "../../context";
import { server } from "../../mocks/server";
import TelicentMap from "./TelicentMap";
import Categories from "./../Categories/Categories";
import * as mapboxFeatures from "./mapboxFeatures";
import * as utils from "./../Categories/utils";

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

const TestMapComponent = ({ testComponent }) => {
  return (
    <CytoscapeProvider>
      <ElementsProvider>
        <ElementsContext.Consumer>
          {({ assets, connections, selectedElements, onElementClick }) => {
            return (
              <>
                {testComponent && testComponent({ assets, connections, onElementClick })}
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
                <TelicentMap />
              </>
            );
          }}
        </ElementsContext.Consumer>
      </ElementsProvider>
    </CytoscapeProvider>
  );
};

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

  test("generates selected assets when an asset is clicked", async () => {
    const spyOnCreateData = jest.spyOn(utils, "createData");
    const spyOnCreateSelectedAssetFeatures = jest.spyOn(
      mapboxFeatures,
      "createSelectedAssetFeatures"
    );
    const spyOnCreateSelectedCxnFeatures = jest.spyOn(
      mapboxFeatures,
      "createSelectedConnectionFeatures"
    );
    const event = { originalEvent: { shiftKey: false } };
    const renderTestBtns = ({ assets, onElementClick }) => (
      <AssetBtn label="E005" assets={assets} event={event} onElementClick={onElementClick} />
    );
    render(<TestMapComponent testComponent={renderTestBtns} />);

    await waitFor(() =>
      expect(screen.getByRole("checkbox", { name: "Energy [25]" })).toBeInTheDocument()
    );
    await user.click(await screen.findByRole("checkbox", { name: "Energy [25]" }));
    expect(screen.getByRole("checkbox", { name: "Energy [25]" })).toBeChecked();
    await waitFor(() => expect(spyOnCreateData).toHaveReturned());

    expect(screen.getAllByTestId("asset")).toHaveLength(5);
    expect(spyOnCreateSelectedAssetFeatures).toHaveBeenCalledTimes(3);
    expect(spyOnCreateSelectedAssetFeatures).toHaveReturnedWith([]);

    expect(screen.getAllByTestId("cxn")).toHaveLength(4);
    expect(spyOnCreateSelectedCxnFeatures).toHaveBeenCalledTimes(3);
    expect(spyOnCreateSelectedCxnFeatures).toHaveReturnedWith([]);

    await user.click(screen.getByRole("button", { name: "E005" }));
    expect(spyOnCreateSelectedAssetFeatures).toHaveBeenCalledTimes(4);
    expect(spyOnCreateSelectedAssetFeatures).toHaveReturned();
    expect(spyOnCreateSelectedCxnFeatures).toHaveBeenCalledTimes(4);
    expect(spyOnCreateSelectedCxnFeatures).toHaveReturned();
  });

  test("generates selected connections", async () => {
    const spyOnCreateData = jest.spyOn(utils, "createData");
    const spyOnCreateSelectedAssetFeatures = jest.spyOn(
      mapboxFeatures,
      "createSelectedAssetFeatures"
    );
    const spyOnCreateSelectedCxnFeatures = jest.spyOn(
      mapboxFeatures,
      "createSelectedConnectionFeatures"
    );
    const event = { originalEvent: { shiftKey: false } };
    const renderTestBtns = ({ connections, onElementClick }) => (
      <CxnBtn
        label="E005 - E006"
        connections={connections}
        event={event}
        onElementClick={onElementClick}
      />
    );
    render(<TestMapComponent testComponent={renderTestBtns} />);

    await waitFor(() =>
      expect(screen.getByRole("checkbox", { name: "Energy [25]" })).toBeInTheDocument()
    );
    await user.click(await screen.findByRole("checkbox", { name: "Energy [25]" }));
    expect(screen.getByRole("checkbox", { name: "Energy [25]" })).toBeChecked();
    await waitFor(() => expect(spyOnCreateData).toHaveReturned());

    expect(screen.getAllByTestId("asset")).toHaveLength(5);
    expect(spyOnCreateSelectedAssetFeatures).toHaveBeenCalledTimes(3);
    expect(spyOnCreateSelectedAssetFeatures).toHaveReturnedWith([]);

    expect(screen.getAllByTestId("cxn")).toHaveLength(4);
    expect(spyOnCreateSelectedCxnFeatures).toHaveBeenCalledTimes(3);
    expect(spyOnCreateSelectedCxnFeatures).toHaveReturnedWith([]);

    await user.click(screen.getByRole("button", { name: "E005 - E006" }));
    expect(spyOnCreateSelectedAssetFeatures).toHaveBeenCalledTimes(4);
    expect(spyOnCreateSelectedAssetFeatures).toHaveReturned();
    expect(spyOnCreateSelectedCxnFeatures).toHaveBeenCalledTimes(4);
    expect(spyOnCreateSelectedCxnFeatures).toHaveReturned();
  });

  test("does NOT render selected energy elements when energy dataset is deselected: asset", async () => {
    const spyOnCreateData = jest.spyOn(utils, "createData");
    const event = { originalEvent: { shiftKey: true } };
    const renderTestBtns = ({ assets, onElementClick }) => (
      <AssetBtn label="E012" assets={assets} event={event} onElementClick={onElementClick} />
    );
    render(<TestMapComponent testComponent={renderTestBtns} />);
    const selectedElements = screen.getByTestId("selected-elements");

    await user.click(await screen.findByRole("checkbox", { name: "Energy [25]" }));
    await user.click(await screen.findByRole("checkbox", { name: "Medical [32]" }));
    expect(screen.getByRole("checkbox", { name: "Energy [25]" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Medical [32]" })).toBeChecked();
    await waitFor(() => expect(spyOnCreateData).toHaveReturned());

    await user.click(screen.getByRole("button", { name: "E012" }));
    expect(within(selectedElements).getAllByTestId("selected-element")).toHaveLength(1);
    expect(
      within(selectedElements).getByText("http://telicent.io/fake_data#E012")
    ).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "Energy [25]" }));
    await waitFor(() =>
      expect(within(selectedElements).queryAllByTestId("selected-element")).toHaveLength(0)
    );
    expect(
      within(selectedElements).queryByText("http://telicent.io/fake_data#E012")
    ).not.toBeInTheDocument();
  });

  test("does NOT render selected energy elements when energy dataset is deselected: connection", async () => {
    const spyOnCreateData = jest.spyOn(utils, "createData");
    const event = { originalEvent: { shiftKey: true } };
    const renderTestBtns = ({ connections, onElementClick }) => (
      <CxnBtn
        label="E005 - E006"
        connections={connections}
        event={event}
        onElementClick={onElementClick}
      />
    );
    render(<TestMapComponent testComponent={renderTestBtns} />);
    const selectedElements = screen.getByTestId("selected-elements");

    await user.click(await screen.findByRole("checkbox", { name: "Energy [25]" }));
    await user.click(await screen.findByRole("checkbox", { name: "Medical [32]" }));
    expect(screen.getByRole("checkbox", { name: "Energy [25]" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Medical [32]" })).toBeChecked();
    await waitFor(() => expect(spyOnCreateData).toHaveReturned());

    await user.click(screen.getByRole("button", { name: "E005 - E006" }));
    expect(within(selectedElements).getAllByTestId("selected-element")).toHaveLength(1);
    expect(
      within(selectedElements).getByText("http://telicent.io/fake_data#connector_E005_E006")
    ).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "Energy [25]" }));
    await waitFor(() =>
      expect(within(selectedElements).queryAllByTestId("selected-element")).toHaveLength(0)
    );
    expect(
      within(selectedElements).queryByText("http://telicent.io/fake_data#connector_E005_E006")
    ).not.toBeInTheDocument();
  });

  test("does NOT render selected energy elements when energy dataset is deselected: asset and connection", async () => {
    const spyOnCreateData = jest.spyOn(utils, "createData");
    const event = { originalEvent: { shiftKey: true } };
    const renderTestBtns = ({ assets, connections, onElementClick }) => (
      <>
        <AssetBtn label="E012" assets={assets} event={event} onElementClick={onElementClick} />
        <CxnBtn
          label="E005 - E006"
          connections={connections}
          event={event}
          onElementClick={onElementClick}
        />
      </>
    );
    render(<TestMapComponent testComponent={renderTestBtns} />);
    const selectedElements = screen.getByTestId("selected-elements");

    await user.click(await screen.findByRole("checkbox", { name: "Energy [25]" }));
    await user.click(await screen.findByRole("checkbox", { name: "Medical [32]" }));
    expect(screen.getByRole("checkbox", { name: "Energy [25]" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Medical [32]" })).toBeChecked();
    await waitFor(() => expect(spyOnCreateData).toHaveReturned());

    await user.click(screen.getByRole("button", { name: "E012" }));
    await user.click(screen.getByRole("button", { name: "E005 - E006" }));
    expect(within(selectedElements).getAllByTestId("selected-element")).toHaveLength(2);
    expect(
      within(selectedElements).getByText("http://telicent.io/fake_data#E012")
    ).toBeInTheDocument();
    expect(
      within(selectedElements).getByText("http://telicent.io/fake_data#connector_E005_E006")
    ).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "Energy [25]" }));
    await waitFor(() =>
      expect(within(selectedElements).queryAllByTestId("selected-element")).toHaveLength(0)
    );
    expect(
      within(selectedElements).queryByText("http://telicent.io/fake_data#E012")
    ).not.toBeInTheDocument();
    expect(
      within(selectedElements).queryByText("http://telicent.io/fake_data#connector_E005_E006")
    ).not.toBeInTheDocument();
  });

  test("renders medical selected elements when energy dataset is deselected: assets", async () => {
    const spyOnCreateData = jest.spyOn(utils, "createData");
    const event = { originalEvent: { shiftKey: true } };
    const renderTestBtns = ({ assets, onElementClick }) => (
      <>
        <AssetBtn label="E012" assets={assets} event={event} onElementClick={onElementClick} />
        <AssetBtn label="M022" assets={assets} event={event} onElementClick={onElementClick} />
        <AssetBtn label="M023" assets={assets} event={event} onElementClick={onElementClick} />
      </>
    );
    render(<TestMapComponent testComponent={renderTestBtns} />);
    const selectedElements = screen.getByTestId("selected-elements");

    await user.click(await screen.findByRole("checkbox", { name: "Energy [25]" }));
    await user.click(await screen.findByRole("checkbox", { name: "Medical [32]" }));
    expect(screen.getByRole("checkbox", { name: "Energy [25]" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Medical [32]" })).toBeChecked();
    await waitFor(() => expect(spyOnCreateData).toHaveReturned());

    await user.click(screen.getByRole("button", { name: "E012" }));
    await user.click(screen.getByRole("button", { name: "M022" }));
    await user.click(screen.getByRole("button", { name: "M023" }));
    expect(within(selectedElements).getAllByTestId("selected-element")).toHaveLength(3);

    await user.click(screen.getByRole("checkbox", { name: "Energy [25]" }));
    await waitFor(() => expect(screen.getAllByTestId("selected-element")).toHaveLength(2));
    expect(
      within(selectedElements).getByText("http://telicent.io/fake_data#M022")
    ).toBeInTheDocument();
    expect(
      within(selectedElements).getByText("http://telicent.io/fake_data#M023")
    ).toBeInTheDocument();
  });

  test("renders energy selected elements when medical dataset is deselected: connections", async () => {
    const spyOnCreateData = jest.spyOn(utils, "createData");
    const event = { originalEvent: { shiftKey: true } };
    const renderTestBtns = ({ connections, onElementClick }) => (
      <>
        <CxnBtn
          label="E005 - E006"
          connections={connections}
          event={event}
          onElementClick={onElementClick}
        />
        <CxnBtn
          label="E012 - M022"
          connections={connections}
          event={event}
          onElementClick={onElementClick}
        />
        <CxnBtn
          label="E012 - M023"
          connections={connections}
          event={event}
          onElementClick={onElementClick}
        />
      </>
    );
    render(<TestMapComponent testComponent={renderTestBtns} />);
    const selectedElements = screen.getByTestId("selected-elements");

    await user.click(await screen.findByRole("checkbox", { name: "Energy [25]" }));
    await user.click(await screen.findByRole("checkbox", { name: "Medical [32]" }));
    expect(screen.getByRole("checkbox", { name: "Energy [25]" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Medical [32]" })).toBeChecked();
    await waitFor(() => expect(spyOnCreateData).toHaveReturned());

    await user.click(screen.getByRole("button", { name: "E005 - E006" }));
    await user.click(screen.getByRole("button", { name: "E012 - M022" }));
    await user.click(screen.getByRole("button", { name: "E012 - M023" }));
    expect(within(selectedElements).getAllByTestId("selected-element")).toHaveLength(3);

    await user.click(screen.getByRole("checkbox", { name: "Medical [32]" }));
    await waitFor(() => expect(screen.getAllByTestId("selected-element")).toHaveLength(1));
    expect(
      within(selectedElements).getByText("http://telicent.io/fake_data#connector_E005_E006")
    ).toBeInTheDocument();
  });

  test("renders energy selected elements when medical dataset is deselected: assets and connections", async () => {
    const spyOnCreateData = jest.spyOn(utils, "createData");
    const event = { originalEvent: { shiftKey: true } };
    const renderTestBtns = ({ assets, connections, onElementClick }) => (
      <>
        <AssetBtn label="E001" assets={assets} event={event} onElementClick={onElementClick} />
        <AssetBtn label="M001" assets={assets} event={event} onElementClick={onElementClick} />
        <CxnBtn
          label="E005 - E006"
          connections={connections}
          event={event}
          onElementClick={onElementClick}
        />
        <CxnBtn
          label="E012 - M022"
          connections={connections}
          event={event}
          onElementClick={onElementClick}
        />
        <CxnBtn
          label="E012 - M023"
          connections={connections}
          event={event}
          onElementClick={onElementClick}
        />
      </>
    );
    render(<TestMapComponent testComponent={renderTestBtns} />);
    const selectedElements = screen.getByTestId("selected-elements");

    await user.click(await screen.findByRole("checkbox", { name: "Energy [25]" }));
    await user.click(await screen.findByRole("checkbox", { name: "Medical [32]" }));
    expect(screen.getByRole("checkbox", { name: "Energy [25]" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Medical [32]" })).toBeChecked();
    await waitFor(() => expect(spyOnCreateData).toHaveReturned());

    await user.click(screen.getByRole("button", { name: "E001" }));
    await user.click(screen.getByRole("button", { name: "M001" }));
    await user.click(screen.getByRole("button", { name: "E005 - E006" }));
    await user.click(screen.getByRole("button", { name: "E012 - M022" }));
    await user.click(screen.getByRole("button", { name: "E012 - M023" }));
    expect(within(selectedElements).getAllByTestId("selected-element")).toHaveLength(5);

    await user.click(screen.getByRole("checkbox", { name: "Medical [32]" }));
    await waitFor(() => expect(screen.getAllByTestId("selected-element")).toHaveLength(2));
    expect(
      within(selectedElements).getByText("http://telicent.io/fake_data#E001")
    ).toBeInTheDocument();
    expect(
      within(selectedElements).getByText("http://telicent.io/fake_data#connector_E005_E006")
    ).toBeInTheDocument();
  });
});
