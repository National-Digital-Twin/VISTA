import { render, screen } from "@testing-library/react";
import ControlsOverlay from ".";

describe("ControlsOverlay", () => {
  it("renders ControlPanel, MapToolbar, and DetailPanels", () => {
    render(<ControlsOverlay />);

    // Panel should be visible by default
    expect(screen.getByTestId("control-panel")).toBeInTheDocument();

    // Detail panels should be rendered
    expect(screen.getByTestId("detail-panel")).toBeInTheDocument();

    // MapToolbar
    expect(screen.getByTestId("map-toolbar")).toBeInTheDocument();
  });
});
