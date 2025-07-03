import { faCompass } from "@fortawesome/free-solid-svg-icons";
import { render, screen, fireEvent } from "@testing-library/react";
import ToolbarButton from "./ToolbarButton";

// Mock FontAwesomeIcon to avoid rendering issues
jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: ({ icon }: any) => (
    <div data-testid="fa-icon">{icon[1]}</div>
  ),
}));

describe("ToolbarButton", () => {
  const defaultProps = {
    title: "Test Button",
    onClick: jest.fn(),
    icon: faCompass,
  };
  it("renders with FontAwesome icon", () => {
    render(<ToolbarButton {...defaultProps} />);
    expect(screen.getByTestId("fa-icon")).toBeInTheDocument();
  });

  it("renders with SVG if svgSrc is provided", () => {
    render(
      <ToolbarButton
        {...defaultProps}
        icon={undefined}
        svgSrc="/test-icon.svg"
      />,
    );
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "/test-icon.svg");
    expect(img).toHaveAttribute("alt", "Test Button");
  });

  it("applies compass rotation if compassRotation is provided", () => {
    render(
      <ToolbarButton
        {...defaultProps}
        icon={undefined}
        svgSrc="/test.svg"
        compassRotation={45}
      />,
    );
    const img = screen.getByRole("img");
    expect(img).toHaveStyle({ transform: "rotate(45deg)" });
  });

  it("calls onClick when clicked", () => {
    render(<ToolbarButton {...defaultProps} />);
    const button = screen.getByRole("button", { name: /test button/i });
    fireEvent.click(button);
    expect(defaultProps.onClick).toHaveBeenCalled();
  });

  it("displays badge content when provided", () => {
    render(<ToolbarButton {...defaultProps} badgeContent={3} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("applies tooltip title", async () => {
    render(<ToolbarButton {...defaultProps} />);
    const button = screen.getByRole("button", { name: /test button/i });
    expect(button).toHaveAttribute("aria-label", "Test Button");
  });

  it("applies active state styling when active prop is true", () => {
    render(
      <ToolbarButton
        {...defaultProps}
        icon={undefined}
        svgSrc="/test-icon.svg"
        active={true}
      />,
    );

    const button = screen.getByRole("button", { name: /test button/i });
    expect(button).toHaveStyle({
      backgroundColor: "rgb(42, 90, 143)",
      color: "white",
    });

    const img = screen.getByRole("img");
    expect(img).toHaveStyle({ filter: "brightness(0) invert(100%)" });
  });

  it("applies default styling when active prop is false", () => {
    render(
      <ToolbarButton
        {...defaultProps}
        icon={undefined}
        svgSrc="/test-icon.svg"
        active={false}
      />,
    );

    const button = screen.getByRole("button", { name: /test button/i });
    expect(button).toHaveStyle({
      backgroundColor: "rgb(240, 240, 240)",
      color: "black",
    });

    const img = screen.getByRole("img");
    expect(img).toHaveStyle({ filter: "none" });
  });
});
