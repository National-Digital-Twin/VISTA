import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import DevTools from ".";

// Mock the lazy-loaded DevToolsContainer
jest.mock("./DevToolsContainer", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="devtools-container">{children}</div>
  ),
}));

describe("DevTools", () => {
  it("renders only children when disabled", () => {
    render(
      <DevTools enabled={false}>
        <div data-testid="app-content">App Content</div>
      </DevTools>
    );

    expect(screen.getByTestId("app-content")).toBeInTheDocument();
    expect(screen.queryByTestId("devtools-container")).not.toBeInTheDocument();
  });

  it("renders DevToolsContainer and children when enabled", async () => {
    render(
      <DevTools enabled={true}>
        <div data-testid="app-content">App Content</div>
      </DevTools>
    );

    // Fallback should be visible while lazy loading
    expect(screen.getByText("Loading dev tools...")).toBeInTheDocument();

    // Wait for lazy component to load
    await waitFor(() => {
      expect(screen.getByTestId("devtools-container")).toBeInTheDocument();
    });

    // Children should be rendered inside the container
    expect(screen.getByTestId("app-content")).toBeInTheDocument();
  });
});
