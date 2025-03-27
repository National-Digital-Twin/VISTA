import { render, screen, fireEvent } from "@testing-library/react";
import { faLayerGroup } from "@fortawesome/free-solid-svg-icons";
import ComplexLayerControl from ".";

describe("ComplexLayerControl", () => {
  const title = "Test Layer";
  const content = <div data-testid="layer-children">Child Content</div>;

  it("renders title and icon", () => {
    render(
      <ComplexLayerControl title={title} icon={faLayerGroup}>
        {content}
      </ComplexLayerControl>,
    );

    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByTestId("layer-children")).not.toBeVisible(); // Initially hidden
    expect(screen.getByRole("button")).toBeInTheDocument(); // IconButton
  });

  it("toggles expansion when clicked", () => {
    render(<ComplexLayerControl title={title}>{content}</ComplexLayerControl>);

    const toggleBox = screen.getByText(title).closest("div")!;

    // Initially collapsed
    expect(screen.getByTestId("layer-children")).not.toBeVisible();

    // Click to expand
    fireEvent.click(toggleBox);
    expect(screen.getByTestId("layer-children")).toBeVisible();

    // Click to collapse again
    fireEvent.click(toggleBox);
    expect(screen.getByTestId("layer-children")).not.toBeVisible();
  });

  it("toggles expansion with keyboard", () => {
    render(<ComplexLayerControl title={title}>{content}</ComplexLayerControl>);

    const toggleBox = screen.getByText(title).closest("div")!;

    // Press Enter
    fireEvent.keyDown(toggleBox, { key: "Enter" });
    expect(screen.getByTestId("layer-children")).toBeVisible();

    // Press Space
    fireEvent.keyDown(toggleBox, { key: " " });
    expect(screen.getByTestId("layer-children")).not.toBeVisible();
  });

  it("respects autoShowHide prop", () => {
    render(
      <ComplexLayerControl title={title} autoShowHide>
        {content}
      </ComplexLayerControl>,
    );

    const root = screen.getByText(title).closest("[data-auto-show-hide]")!;
    expect(root).toHaveAttribute("data-auto-show-hide", "true");
  });
});
