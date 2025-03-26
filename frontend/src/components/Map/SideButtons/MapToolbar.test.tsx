import { render, screen } from "@testing-library/react";
import MapToolbar from "./MapToolbar";

// ✅ Mock useTools to return mock side buttons
jest.mock("@/tools/useTools", () => ({
  useTools: jest.fn(() => [
    {
      TOOL_NAME: "ToolWithButtons",
      SideButtons: () => <div data-testid="side-button">Side Button A</div>,
    },
    {
      TOOL_NAME: "ToolWithoutButtons",
      // No SideButtons
    },
  ]),
}));

describe("MapToolbar", () => {
  it("renders side buttons from tools", () => {
    render(<MapToolbar />);

    // Side button from the first tool should be rendered
    expect(screen.getByTestId("side-button")).toBeInTheDocument();
    expect(screen.getByText("Side Button A")).toBeInTheDocument();

    // Only one side button should be rendered (second tool has no SideButtons)
    expect(screen.queryAllByTestId("side-button")).toHaveLength(1);
  });

  it("applies additional className if provided", () => {
    render(<MapToolbar className="custom-toolbar" />);
    expect(screen.getByRole("presentation").className).toContain(
      "custom-toolbar",
    );
  });
});
