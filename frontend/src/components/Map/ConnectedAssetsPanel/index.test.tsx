import { render, screen, fireEvent } from "@testing-library/react";
import ConnectedAssetsPanel from ".";



const mockAssetData = {
  title: "Test Asset",
  id: "ASSET-123",
  type: "Database",
  assetUri: "asset-uri-1",
  isAsset: true,
  isDependency: false,
  dependant: { count: 3 },
  provider: "provider-id",
};

describe("ConnectedAssetsPanel", () => {
  it("renders title, ID and type", () => {
    render(<ConnectedAssetsPanel connectedAssetData={mockAssetData} hideConnectedAssets={jest.fn()} />);
    expect(screen.getByText("Test Asset")).toBeInTheDocument();
    expect(screen.getByText("ASSET-123")).toBeInTheDocument();
    expect(screen.getByText("Database")).toBeInTheDocument();
  });

  it("renders tabs with counts", () => {
    render(<ConnectedAssetsPanel connectedAssetData={mockAssetData} hideConnectedAssets={jest.fn()} />);
    expect(screen.getByText(/Dependant Assets \(3\)/)).toBeInTheDocument();
    expect(screen.getByText(/Provider Assets \(2\)/)).toBeInTheDocument();
  });

  it("renders Dependents by default", () => {
    render(<ConnectedAssetsPanel connectedAssetData={mockAssetData} hideConnectedAssets={jest.fn()} />);
    expect(screen.getByTestId("dependents-component")).toBeInTheDocument();
  });

  it("renders Providers on tab switch", () => {
    render(<ConnectedAssetsPanel connectedAssetData={mockAssetData} hideConnectedAssets={jest.fn()} />);
    const providerTab = screen.getByText(/Provider Assets/);
    fireEvent.click(providerTab);
    expect(screen.getByTestId("providers-component")).toBeInTheDocument();
  });

});
