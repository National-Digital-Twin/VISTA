import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { useContext } from "react";
import { CytoscapeContext, CytoscapeProvider } from "../../context";
import Toolbar from "./GraphToolbar";

const user = userEvent.setup();

const ToolbarTestComponent = ({ cyRef }) => {
  const { layout, updateLayout } = useContext(CytoscapeContext);
  return <Toolbar cyRef={cyRef} graphLayout={layout} setGraphLayout={updateLayout} />;
};

describe("GraphToolbar component", () => {
  test("renders all layout options", async () => {
    render(<ToolbarTestComponent />, { wrapper: CytoscapeProvider });
    const layoutBtn = screen.getByRole("button", { name: /layout/i });
    await user.hover(layoutBtn);
    expect(screen.getByText("Layout")).toBeVisible();
    expect(screen.queryByTestId("secondary-menu")).not.toBeInTheDocument();

    await user.click(layoutBtn);

    const secondaryMenuItems = within(screen.getByTestId("secondary-menu")).getAllByRole(
      "listitem"
    );
    expect(secondaryMenuItems).toHaveLength(6);
    expect(secondaryMenuItems).toMatchSnapshot("layout options");
  });

  test("renders Cola as the default graph layout", async () => {
    render(<ToolbarTestComponent />, { wrapper: CytoscapeProvider });
    await user.click(screen.getByRole("button", { name: /layout/i }));

    const secondaryMenuItems = within(screen.getByTestId("secondary-menu")).getAllByRole(
      "listitem"
    );
    expect(within(secondaryMenuItems[0]).getByRole("button", { name: "Cola" })).toHaveClass(
      "bg-black-500"
    );
  });

  test("renders updated graph layout", async () => {
    render(<ToolbarTestComponent />, { wrapper: CytoscapeProvider });
    await user.click(screen.getByRole("button", { name: /layout/i }));

    const secondaryMenuItems = within(screen.getByTestId("secondary-menu")).getAllByRole(
      "listitem"
    );
    await user.click(within(secondaryMenuItems[1]).getByRole("button", { name: "Grid" }));

    expect(within(secondaryMenuItems[1]).getByRole("button", { name: "Grid" })).toHaveClass(
      "bg-black-500"
    );
    expect(within(secondaryMenuItems[0]).getByRole("button", { name: "Cola" })).not.toHaveClass(
      "bg-black-500"
    );
  });

  test("pans and zooms the graph to fit", async () => {
    const mockFit = jest.fn();
    const cy = { current: { fit: mockFit } };
    render(<ToolbarTestComponent cyRef={cy} />, { wrapper: CytoscapeProvider });

    const fitBtn = screen.getByRole("button", { name: /fit/i });
    await user.hover(fitBtn);
    expect(screen.getByText("Fit")).toBeVisible();

    await user.click(fitBtn);
    expect(mockFit).toHaveBeenCalledTimes(1);
  });

  test("pans the graph to the centre", async () => {
    const mockCenter = jest.fn();
    const cy = { current: { center: mockCenter } };
    render(<ToolbarTestComponent cyRef={cy} />, { wrapper: CytoscapeProvider });

    const centerBtn = screen.getByRole("button", { name: /center/i });
    await user.hover(centerBtn);
    expect(screen.getByText("Center")).toBeVisible();

    await user.click(centerBtn);
    expect(mockCenter).toHaveBeenCalledTimes(1);
  });

  test("exports current graph view as png", async () => {
    const mockPng = jest.fn();
    const mockRevokeObjectURL = jest.fn();
    const href = "blob:http://localhost:3001/eb1bb2f8-9e7d-4157-9418-cafe78aba65a";
    const cy = { current: { png: mockPng } };
    global.window.URL.createObjectURL = jest.fn().mockReturnValue(href);
    global.window.URL.revokeObjectURL = mockRevokeObjectURL;
    HTMLAnchorElement.prototype.click = jest.fn();
    render(<ToolbarTestComponent cyRef={cy} />, { wrapper: CytoscapeProvider });

    const exportBtn = screen.getByRole("button", { name: /export/i });
    await user.hover(exportBtn);
    expect(screen.getByText("Export")).toBeVisible();

    await user.click(exportBtn);
    expect(mockPng).toHaveBeenCalledTimes(1);
    expect(mockRevokeObjectURL).toHaveBeenCalledTimes(1);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith(href);
  });
});
