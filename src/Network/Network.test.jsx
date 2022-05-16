import { screen, render } from "@testing-library/react";
import ConnectionAssessment from "../DataFigures/ConnectionAssessment";
import Asset from "../DataFigures/Asset";
import { act } from "react-dom/test-utils";
import Network from ".";
import CytoscapeComponent from "react-cytoscapejs";
import Component from "react";

jest.mock("react-cytoscapejs");

const mockCytoscapeComponent = CytoscapeComponent;

const assets = [
  {
    id: "fed",
    uri: "http://fed.co/test-data/iow#W001",
    name: "Federal Reserve",
    gridIndex: 1,
    scoreColour: "hsl(117.96610169491527,100%, 50%)",
    countColour: "hsl(117.96610169491527,100%, 50%)",
    count: 1,
    criticality: 3,
    onClick: jest.fn(),
  },
  {
    id: "irs",
    uri: "http://irs.co/test-data/iow#W002",
    name: "Internal Revenue System",
    gridIndex: 2,
    scoreColour: "hsl(117.96610169491527,100%, 50%)",
    countColour: "hsl(117.96610169491527,100%, 50%)",
    count: 1,
    criticality: 3,
    onClick: jest.fn(),
  },
];

const connections = [
  {
    category: "connection",
    uri: "http://fed.co/iow#connector_W001_W002",
    source: "http://fed.co/test-data/iow#W001",
    sourceName: "Federal Reserve",
    sourceLat: 40.5,
    sourceLon: 20.3,
    sourceScoreColour: "hsl(120,100%, 50%)",
    target: "http://irs.co/test-data/iow#W002",
    targetLat: 40.3,
    targetLon: 20.1,
    targetName: "Internal Revenue Service",
    targetScoreColour: "hsl(120,100%, 50%)",
    criticality: 3,
    label: "W001-W002",
  },
];

describe("Network should", () => {
  beforeEach(() => {
    mockCytoscapeComponent.mockImplementation().mockReturnValue(null);
  });
  it("render a warning message when no assets or connections arrays are passed in", async () => {
    await act(async () => {
      await render(<Network />);
    });

    expect(
      screen.getByText(/please pass in valid assets and connections arrays/i)
    ).toBeInTheDocument();
  });

  it("call cytoscape component when valid assets and connections are passed in", async () => {
    await act(async () => {
      await render(<Network assets={assets} connections={connections} />);
    });

    expect(mockCytoscapeComponent).toHaveBeenCalled();
  });
});
