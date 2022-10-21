import { render, screen, within } from "@testing-library/react";
import React from "react";
import userEvent from "@testing-library/user-event";

import { E001, E001_E003, E003, E005, E005_E006, E006, E006_E012 } from "../../sample-data";
import ElementDetails from "./ElementDetails";
import { createData } from "../Categories/utils";

const assetsMetadata = [E001, E003, E005, E006];
const connectionsMetadata = [E001_E003, E006_E012, E005_E006];

const renderElementDetails = (element) => ({
  user: userEvent.setup(),
  ...render(<ElementDetails element={element} expand onViewDetails={jest.fn()} />),
});

describe("Element details component", () => {
  test("can toggle connected assets section", async () => {
    const data = await createData(assetsMetadata, connectionsMetadata);
    const { assets, assetCriticalityColorScale } = data;
    const element = assets[1].generateDetails(assets, assetCriticalityColorScale);
    const { user } = renderElementDetails(element);

    expect(
      screen.getByRole("heading", { name: "1 Connected Assets", level: 3 })
    ).toBeInTheDocument();
    expect(screen.getByRole("list")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "1 Connected Assets" }));
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});

describe("Element details component: asset", () => {
  test("renders name", async () => {
    const data = await createData(assetsMetadata, connectionsMetadata);
    const { assets, assetCriticalityColorScale } = data;
    const element = assets[0].generateDetails(assets, assetCriticalityColorScale);
    renderElementDetails(element);

    expect(
      screen.getByRole("heading", { name: "East Cowes Power Station (E001)" })
    ).toBeInTheDocument();
  });

  test("renders type", async () => {
    const data = await createData(assetsMetadata, connectionsMetadata);
    const { assets, assetCriticalityColorScale } = data;
    const element = assets[0].generateDetails(assets, assetCriticalityColorScale);
    renderElementDetails(element);

    expect(screen.getByText("ies:Facility")).toBeInTheDocument();
  });

  test("renders criticality", async () => {
    const data = await createData(assetsMetadata, connectionsMetadata);
    const { assets, assetCriticalityColorScale } = data;
    const element = assets[0].generateDetails(assets, assetCriticalityColorScale);
    renderElementDetails(element);

    expect(screen.getByText("Criticality: 3")).toBeInTheDocument();
  });

  test("renders description", async () => {
    const data = await createData(assetsMetadata, connectionsMetadata);
    const { assets, assetCriticalityColorScale } = data;
    const element = assets[0].generateDetails(assets, assetCriticalityColorScale);
    renderElementDetails(element);

    expect(screen.getByTestId("description")).toBeInTheDocument();
  });

  test("does NOT render description when asset doesn't have description", async () => {
    const data = await createData(assetsMetadata, connectionsMetadata);
    const { assets, assetCriticalityColorScale } = data;
    const element = assets[1].generateDetails(assets, assetCriticalityColorScale);
    renderElementDetails(element);

    expect(screen.queryByTestId("description")).not.toBeInTheDocument();
  });

  test("renders connected assets", async () => {
    const data = await createData(assetsMetadata, connectionsMetadata);
    const { assets, assetCriticalityColorScale } = data;
    const element = assets[1].generateDetails(assets, assetCriticalityColorScale);
    renderElementDetails(element);

    expect(
      screen.getByRole("heading", { name: "1 Connected Assets", level: 3 })
    ).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    const connectedAsset = screen.getByRole("listitem");
    expect(
      within(connectedAsset).getByRole("heading", {
        name: "East Cowes Power Station (E001)",
        level: 4,
      })
    ).toBeInTheDocument();
    expect(within(connectedAsset).getByText("Asset criticality: 3")).toBeInTheDocument();
    expect(within(connectedAsset).getByText("Connection criticality: 3")).toBeInTheDocument();
  });
});

describe("Element details component: connection", () => {
  test("renders name", async () => {
    const data = await createData(assetsMetadata, connectionsMetadata);
    const { assets, connections, cxnCriticalityColorScale } = data;
    const element = connections[0].generateDetails(assets, cxnCriticalityColorScale);
    renderElementDetails(element);

    expect(
      screen.getByRole("heading", {
        name: "East Cowes Power Station (E001) to East Cowes 132/33kV Substation (E003)",
      })
    ).toBeInTheDocument();
  });

  test("renders criticality", async () => {
    const data = await createData(assetsMetadata, connectionsMetadata);
    const { assets, connections, cxnCriticalityColorScale } = data;
    const element = connections[0].generateDetails(assets, cxnCriticalityColorScale);
    renderElementDetails(element);

    expect(screen.getByText("Criticality: 3")).toBeInTheDocument();
  });

  test("renders connected assets", async () => {
    const data = await createData(assetsMetadata, connectionsMetadata);
    const { assets, connections, cxnCriticalityColorScale } = data;
    const element = connections[0].generateDetails(assets, cxnCriticalityColorScale);
    renderElementDetails(element);

    expect(
      screen.getByRole("heading", { name: "2 Connected Assets", level: 3 })
    ).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);

    const connectedAsset1 = screen.getAllByRole("listitem")[0];
    expect(
      within(connectedAsset1).getByRole("heading", {
        name: "East Cowes Power Station (E001)",
        level: 4,
      })
    ).toBeInTheDocument();
    expect(within(connectedAsset1).getByText("Asset criticality: 3")).toBeInTheDocument();
    expect(within(connectedAsset1).getByText("Connection criticality: 3")).toBeInTheDocument();

    const connectedAsset2 = screen.getAllByRole("listitem")[1];
    expect(
      within(connectedAsset2).getByRole("heading", {
        name: "East Cowes 132/33kV Substation (E003)",
        level: 4,
      })
    ).toBeInTheDocument();
    expect(within(connectedAsset2).getByText("Asset criticality: 3")).toBeInTheDocument();
    expect(within(connectedAsset2).getByText("Connection criticality: 3")).toBeInTheDocument();
  });
});
