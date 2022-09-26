import { render, screen } from "@testing-library/react";
import Details from "./Details";

const assetMetadata = {
  category: "asset",
  count: 1,
  countColour: "#128300",
  criticality: 3,
  id: "W002",
  lat: [50.60448667555639],
  lon: [-1.3194855462183237],
  maxCount: 49,
  maxScore: 147,
  name: "Chale Street Chale Wps",
  scoreColour: "#128300",
  type: "http://ies.data.gov.uk/ontology/ies4#Facility",
  uri: "http://telicent.io/fake_data#W002",
};

const connectionMetadata = {
  category: "connection",
  criticality: 3,
  label: "W001-W002",
  scoreColour: "#128300",
  source: "http://telicent.io/fake_data#W001",
  sourceName: "Chale wtw",
  sourceAsset: {
    name: "Chale wtw",
    scoreColour: "#128300",
  },
  target: "http://telicent.io/fake_data#W002",
  targetName: "Chale Street Chale Wps",
  targetAsset: {
    name: "Chale Street Chale Wps",
    scoreColour: "#128300",
  },
  uri: "http://telicent.io/fake_data#connector_W001_W002",
};

const renderDetailsComponent = (element) => render(<Details element={element} />);

describe("Details component", () => {
  it("renders message when elements is falsy", () => {
    const { rerender } = render(<Details />);
    expect(
      screen.getByText(/click on an asset or connection to view details/i)
    ).toBeInTheDocument();

    rerender(<Details element={{}} />);
    expect(
      screen.getByText(/click on an asset or connection to view details/i)
    ).toBeInTheDocument();
  });

  test("renders asset name", () => {
    renderDetailsComponent(assetMetadata);
    expect(screen.getByRole("heading", { level: 2, name: assetMetadata.name })).toBeInTheDocument();
  });

  test("renders asset ID", () => {
    renderDetailsComponent(assetMetadata);
    expect(screen.getByTestId("asset-id")).toHaveTextContent(`ID: ${assetMetadata.id}`);
  });

  test("renders open street view link when an asset is selected", () => {
    renderDetailsComponent(assetMetadata);

    const viewpoint = encodeURIComponent(`${assetMetadata.lat[0]},${assetMetadata.lon[0]}`);
    expect(screen.getByRole("link", { name: /open street view/i })).toHaveAttribute(
      "href",
      `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${viewpoint}`
    );
  });

  test("renders connection name", () => {
    renderDetailsComponent(connectionMetadata);
    expect(
      screen.getByRole("heading", { level: 2, name: connectionMetadata.label })
    ).toBeInTheDocument();
  });

  test("renders connection details", () => {
    renderDetailsComponent(connectionMetadata);
    expect(screen.getByTestId("connection-details")).toHaveTextContent('connects Chale wtw and Chale Street Chale Wps');
  });
});
