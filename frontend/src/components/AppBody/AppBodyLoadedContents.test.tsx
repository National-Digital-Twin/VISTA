import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import AppBodyLoadedContents from "./AppBodyLoadedContents";
// Mocking ElementsProvider
jest.mock("../../context/ElementContext", () => ({
  ElementsProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="elements-provider">{children}</div>,
}));

// Mocking ParalogMap component
jest.mock("../Map/ParalogMap", () => () => <div data-testid="paralog-map">Paralog Map</div>);

describe("AppBodyLoadedContents Component", () => {
  it("should render ElementsProvider and ParalogMap", () => {
    render(<AppBodyLoadedContents />);

    // Verify ElementsProvider renders
    expect(screen.getByTestId("elements-provider")).toBeInTheDocument();

    // Verify ParalogMap renders
    expect(screen.getByTestId("paralog-map")).toBeInTheDocument();
  });
});
