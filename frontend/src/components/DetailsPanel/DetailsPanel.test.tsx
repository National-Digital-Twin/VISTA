import { render, screen, fireEvent } from "@testing-library/react";
import DetailsPanel from "./DetailsPanel";

// Mock styles (CSS modules)
jest.mock("./style.module.css", () => ({
  detailsPanel: "detailsPanel",
  resizeHandle: "resizeHandle",
  toggleButton: "toggleButton",
  content: "content",
  noSelect: "noSelect",
}));

describe("DetailsPanel", () => {
  it("renders children correctly", () => {
    render(
      <DetailsPanel isOpen={true}>
        <div data-testid="panel-content">Hello panel</div>
      </DetailsPanel>
    );
    expect(screen.getByTestId("panel-content")).toBeInTheDocument();
  });

  xit("sets data-expanded attribute based on isOpen prop", () => {
    const { rerender } = render(<DetailsPanel isOpen={false}>Test</DetailsPanel>);
    expect(screen.getByRole("region")).toHaveAttribute("data-expanded", "false");

    rerender(<DetailsPanel isOpen={true}>Test</DetailsPanel>);
    expect(screen.getByRole("region")).toHaveAttribute("data-expanded", "true");
  });

  it("calls onClose when toggle button is clicked", () => {
    const handleClose = jest.fn();
    render(
      <DetailsPanel isOpen={true} onClose={handleClose}>
        Test
      </DetailsPanel>
    );
    fireEvent.click(screen.getByRole("button"));
    expect(handleClose).toHaveBeenCalled();
  });

  xit("adds and removes noSelect class on mouse drag", () => {
    render(<DetailsPanel isOpen={true}>Test</DetailsPanel>);

    const handle = screen.getByTestId("resize-handle") || document.querySelector(".resizeHandle");

    const mouseDown = new MouseEvent("mousedown", { bubbles: true, clientY: 300 });
    const mouseMove = new MouseEvent("mousemove", { bubbles: true, clientY: 200 });
    const mouseUp = new MouseEvent("mouseup", { bubbles: true });

    fireEvent(handle, mouseDown);
    expect(document.body.classList.contains("noSelect")).toBe(true);

    fireEvent(document, mouseMove);
    fireEvent(document, mouseUp);

    expect(document.body.classList.contains("noSelect")).toBe(false);
  });
});
