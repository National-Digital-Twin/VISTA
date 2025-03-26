import { render, screen, fireEvent } from "@testing-library/react";
import ToolbarButton from "./ToolbarButton";
import { faCompass } from "@fortawesome/free-solid-svg-icons";

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
});
