import { render, screen, waitFor } from "@testing-library/react";
import AppBody from ".";

// Mock the lazy-loaded component
jest.mock("./AppBodyLoadedContents", () => () => <div data-testid="loaded-contents">Loaded Contents</div>);

describe("AppBody", () => {
  it("renders with custom className", () => {
    render(<AppBody className="custom-class" />);
    const main = screen.getByRole("main");
    expect(main).toHaveClass("custom-class");
  });

  it("renders the lazy-loaded component", async () => {
    render(<AppBody />);
    await waitFor(() => {
      expect(screen.getByTestId("loaded-contents")).toBeInTheDocument();
    });
  });
});
