import { render, screen } from "@testing-library/react";
import DevToolsContainer from "./DevToolsContainer";

// Mock ReactQueryDevtools so we can test without the actual UI
jest.mock("@tanstack/react-query-devtools", () => ({
  ReactQueryDevtools: () => <div data-testid="react-query-devtools" />,
}));

describe("DevToolsContainer", () => {
  it("renders children and ReactQueryDevtools", () => {
    render(
      <DevToolsContainer>
        <div data-testid="child">Hello Child</div>
      </DevToolsContainer>
    );

    // Check if children are rendered
    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Hello Child")).toBeInTheDocument();

    // Check if ReactQueryDevtools is rendered
    expect(screen.getByTestId("react-query-devtools")).toBeInTheDocument();
  });
});
