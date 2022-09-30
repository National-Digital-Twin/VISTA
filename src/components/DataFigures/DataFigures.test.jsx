import { screen, render } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import DataFigures from "./index";
import AssetProvider from "../../AssetContext";
import ElementsProvider from "../../ElementsContext";
import CytoscapeComponent from "react-cytoscapejs";
import userEvent from "@testing-library/user-event";

jest.mock("react-cytoscapejs");

const mockCytoscapeComponent = CytoscapeComponent;

const assetResponse = [
  {
    uri: "http://telicent.io/test-data/iow#E004",
    id: "E004",
    name: "Wooton Common 132/33kV Substation",
    type: "http://ies.data.gov.uk/ontology/ies4#Facility",
    lat: "50.71042665150134",
    lon: "-1.2539149080275813",
  },
  {
    id: "E018",
    lat: "50.72382490492339",
    lon: "-1.157351952291377",
    name: "Ryde St John rail 33kV Substation",
    type: "http://ies.data.gov.uk/ontology/ies4#Facility",
    uri: "http://telicent.io/test-data/iow#E018",
  },
];

const connectionResponse = [
  {
    connUri: "http://telicent.io/test-data/iow#connector_E004_E018",
    asset1Uri: "http://telicent.io/test-data/iow#E004",
    asset2Uri: "http://telicent.io/test-data/iow#E018",
    criticality: "1.0",
  },
];

xdescribe("DataFigures should", () => {
  beforeEach(async () => {
    fetchMock.resetMocks();
    mockCytoscapeComponent.mockImplementation().mockReturnValue(null);
  });

  it("populate assets and connections on checkbox select", async () => {
    jest
      .spyOn(Promise, "all")
      .mockReturnValue(Promise.resolve([assetResponse, connectionResponse]));

    await act(async () => {
      await render(
        <ElementsProvider>
          <AssetProvider>
            <DataFigures selected={["http://telicent.io/fake_data#Water_Assessment"]} />
          </AssetProvider>
        </ElementsProvider>
      );
    });

    userEvent.click(screen.getByRole("tab", { name: "Grid" }));

    expect(screen.getAllByRole("cell")).toMatchSnapshot();
  });
});