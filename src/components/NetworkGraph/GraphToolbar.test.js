import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { useContext } from "react";
import ElementsProvider, { ElementsContext } from "../../ElementsContext";
import Toolbar from "./GraphToolbar";

const ToolbarTestComponent = ({ cyRef }) => {
  const { graphLayout, updateGraphLayout } = useContext(ElementsContext);
  return <Toolbar cyRef={cyRef} graphLayout={graphLayout} setGraphLayout={updateGraphLayout} />;
};

const expandToolbar = () => {
  userEvent.click(screen.getByRole("button", { name: "Toolbar" }));
};

describe("GraphToolbar component", () => {
  test("is not expanded by default", () => {
    render(<ToolbarTestComponent />, { wrapper: ElementsProvider });
    expect(screen.getByRole("button", { name: "Toolbar" })).toBeInTheDocument();
  });

  test("minimises toolbar", () => {
    render(<ToolbarTestComponent />, { wrapper: ElementsProvider });
    expandToolbar();
    userEvent.click(screen.getByRole("button", { name: "minimise toolbar" }));

    expect(screen.getByRole("button", { name: "Toolbar" })).toBeInTheDocument();
  });

  test("renders all layout options", () => {
    render(<ToolbarTestComponent />, { wrapper: ElementsProvider });
    expandToolbar();
    const layoutBtn = screen.getByRole("button", { name: /layout/i });
    userEvent.hover(layoutBtn);
    expect(screen.getByText("Layout")).toBeVisible();
    expect(screen.queryByTestId("secondary-menu")).not.toBeInTheDocument();

    userEvent.click(layoutBtn);

    const secondaryMenuItems = within(screen.getByTestId("secondary-menu")).getAllByRole(
      "listitem"
    );
    expect(secondaryMenuItems).toHaveLength(6);
    expect(
      within(secondaryMenuItems[0]).getByRole("button", { name: "Circle" })
    ).toBeInTheDocument();
    expect(
      within(secondaryMenuItems[1]).getByRole("button", { name: "Random" })
    ).toBeInTheDocument();
    expect(
      within(secondaryMenuItems[2]).getByRole("button", { name: "Breadth First" })
    ).toBeInTheDocument();
    expect(
      within(secondaryMenuItems[3]).getByRole("button", { name: "AVSDF" })
    ).toBeInTheDocument();
    expect(
      within(secondaryMenuItems[4]).getByRole("button", { name: "Dagre" })
    ).toBeInTheDocument();
    expect(within(secondaryMenuItems[5]).getByRole("button", { name: "Cola" })).toBeInTheDocument();
  });

  test("renders Cola as the default graph layout", () => {
    render(<ToolbarTestComponent />, { wrapper: ElementsProvider });
    expandToolbar();
    userEvent.click(screen.getByRole("button", { name: /layout/i }));

    const secondaryMenuItems = within(screen.getByTestId("secondary-menu")).getAllByRole(
      "listitem"
    );
    expect(within(secondaryMenuItems[5]).getByRole("button", { name: "Cola" })).toHaveClass(
      "bg-black-500"
    );
  });

  test("renders updated graph layout", () => {
    render(<ToolbarTestComponent />, { wrapper: ElementsProvider });
    expandToolbar();
    userEvent.click(screen.getByRole("button", { name: /layout/i }));

    const secondaryMenuItems = within(screen.getByTestId("secondary-menu")).getAllByRole(
      "listitem"
    );
    userEvent.click(within(secondaryMenuItems[0]).getByRole("button", { name: "Circle" }));

    expect(within(secondaryMenuItems[0]).getByRole("button", { name: "Circle" })).toHaveClass(
      "bg-black-500"
    );
    expect(within(secondaryMenuItems[5]).getByRole("button", { name: "Cola" })).not.toHaveClass(
      "bg-black-500"
    );
  });

  test("pans and zooms the graph to fit", () => {
    const mockFit = jest.fn();
    const cy = {
      current: {
        fit: mockFit,
      },
    };
    render(<ToolbarTestComponent cyRef={cy} />, { wrapper: ElementsProvider });
    expandToolbar();
    const fitBtn = screen.getByRole("button", { name: /fit/i });
    userEvent.hover(fitBtn);
    expect(screen.getByText("Fit")).toBeVisible();

    userEvent.click(fitBtn);
    expect(mockFit).toHaveBeenCalledTimes(1);
  });

  test("pans the graph to the centre", () => {
    const mockCenter = jest.fn();
    const cy = {
      current: {
        center: mockCenter,
      },
    };
    render(<ToolbarTestComponent cyRef={cy} />, { wrapper: ElementsProvider });
    expandToolbar();
    const centerBtn = screen.getByRole("button", { name: /center/i });
    userEvent.hover(centerBtn);
    expect(screen.getByText("Center")).toBeVisible();

    userEvent.click(centerBtn);
    expect(mockCenter).toHaveBeenCalledTimes(1);
  });

  test("exports current graph view as png", async () => {
    const mockPng = jest.fn();
    const mockRevokeObjectURL = jest.fn();
    const href = "blob:http://localhost:3001/eb1bb2f8-9e7d-4157-9418-cafe78aba65a";
    const cy = {
      current: {
        png: mockPng,
      },
    };
    global.URL.createObjectURL = jest.fn().mockReturnValue(href);
    global.URL.revokeObjectURL = mockRevokeObjectURL;
    render(<ToolbarTestComponent cyRef={cy} />, { wrapper: ElementsProvider });
    expandToolbar();

    const exportBtn = screen.getByRole("button", { name: /export/i });
    userEvent.hover(exportBtn);
    expect(screen.getByText("Export")).toBeVisible();

    userEvent.click(exportBtn);
    expect(mockPng).toHaveBeenCalledTimes(1);
    expect(mockRevokeObjectURL).toHaveBeenCalledTimes(1);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith(href);
  });
});
