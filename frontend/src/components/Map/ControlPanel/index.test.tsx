import { render, screen, fireEvent } from "@testing-library/react";
import ControlPanel from ".";

jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: () => <span data-testid="fa-icon" />,
}));

jest.mock("@/utils/tabHelpers", () => ({
  a11yProps: (index: number) => ({ id: `tab-${index}`, "aria-controls": `tabpanel-${index}` }),
  TabPanel: ({ children, value, index }: any) => (value === index ? <div>{children}</div> : null),
}));

jest.mock("@/tools/LayersControlPanel", () => ({
  LayersControlPanel: () => <div data-testid="layers-panel">Layers Panel</div>,
}));
jest.mock("@/tools/AssetDetails", () => ({
  AssetDetailControlPanel: ({ showConnectedAssets, setConnectedAssetData }: any) => (
    <div data-testid="asset-details-panel">
      Asset Detail Panel
      <button onClick={() => {
        showConnectedAssets();
        setConnectedAssetData({ id: "mock-asset" });
      }}>Trigger Connected Asset</button>
    </div>
  ),
}));

// ✅ Mock ConnectedAssetsPanel
jest.mock("../ConnectedAssetsPanel", () => ({
  __esModule: true,
  default: ({ connectedAssetData }: any) => (
    <div data-testid="connected-assets-panel">{connectedAssetData?.id}</div>
  ),
}));

describe("ControlPanel", () => {
  const hideMock = jest.fn();
  const showMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders both tabs and shows Layers panel by default", () => {
    render(
      <ControlPanel
        connectedAssetsPanelOpen={false}
        hideConnectedAssets={hideMock}
        showConnectedAssets={showMock}
      />
    );

    expect(screen.getByText("Layers")).toBeInTheDocument();
    expect(screen.getByText("Asset Details")).toBeInTheDocument();
    expect(screen.getByTestId("layers-panel")).toBeInTheDocument();
  });

  it("switches to Asset Details tab and renders AssetDetailControlPanel", () => {
    render(
      <ControlPanel
        connectedAssetsPanelOpen={false}
        hideConnectedAssets={hideMock}
        showConnectedAssets={showMock}
      />
    );

    fireEvent.click(screen.getByText("Asset Details"));
    expect(screen.getByTestId("asset-details-panel")).toBeInTheDocument();
  });

  it("conditionally renders ConnectedAssetsPanel when connectedAssetsPanelOpen is true", () => {
    render(
      <ControlPanel
        connectedAssetsPanelOpen={true}
        hideConnectedAssets={hideMock}
        showConnectedAssets={showMock}
      />
    );

    expect(screen.getByTestId("connected-assets-panel")).toBeInTheDocument();
  });

  it("handles AssetDetailControlPanel button triggering connected asset", () => {
    render(
      <ControlPanel
        connectedAssetsPanelOpen={true}
        hideConnectedAssets={hideMock}
        showConnectedAssets={showMock}
      />
    );

    fireEvent.click(screen.getByText("Asset Details"));
    fireEvent.click(screen.getByText("Trigger Connected Asset"));

    expect(showMock).toHaveBeenCalled();
    expect(screen.getByTestId("connected-assets-panel")).toHaveTextContent("mock-asset");
  });
});
