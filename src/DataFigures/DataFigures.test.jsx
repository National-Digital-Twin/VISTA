import { screen, render } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import DataFigures from ".";
import AssetProvider from "../AssetContext";
import ElementsProvider from "../ElementsContext";
import CytoscapeComponent from "react-cytoscapejs";

jest.mock("react-cytoscapejs");
const mockCytoscapeComponent = CytoscapeComponent;

const response = JSON.stringify([
  {
    uri: "http://telicent.io/test-data/iow#Water_Assessment",
    name: "Water",
    assCount: "94",
  },
  {
    uri: "http://telicent.io/test-data/iow#Energy_Assessment",
    name: "Energy",
    assCount: "25",
  },
  {
    uri: "http://telicent.io/test-data/iow#Transport_Assessment",
    name: "Transport",
    assCount: "44",
  },
  {
    uri: "http://telicent.io/test-data/iow#Fuel_Assessment",
    name: "Fuel",
    assCount: "19",
  },
  {
    uri: "http://telicent.io/test-data/iow#Medical_Assessment",
    name: "Medical",
    assCount: "32",
  },
  {
    uri: "http://telicent.io/test-data/iow#IoW_CARVER_Assessment",
    name: "IoW CARVER Assessment",
    assCount: "0",
  },
  {
    uri: "http://telicent.io/test-data/iow#Communications_Assessment",
    name: "Communications",
    assCount: "28",
  },
]);

describe("DataFigures should", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    fetchMock.mockResponse(response);
    mockCytoscapeComponent.mockImplementation().mockReturnValue(null);
  });

  it("call api for assessments of selected criteria", async () => {
    await act(async () => {
      await render(
        <ElementsProvider>
          <AssetProvider>
            <DataFigures />
          </AssetProvider>
        </ElementsProvider>
      );
    });

    expect(fetchMock).toHaveBeenCalled();
  });
});
