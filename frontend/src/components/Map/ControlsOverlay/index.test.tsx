import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ControlsOverlay from ".";

jest.mock("@/api/apollo-client", () => ({
  __esModule: true,
  default: {},
  GET_ROAD_ROUTE: {},
  GET_LOW_BRIDGES: {},
}));

const createWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("ControlsOverlay", () => {
  it("renders ControlPanel, MapToolbar, and DetailPanels", () => {
    render(<ControlsOverlay />, { wrapper: createWrapper });

    // Panel should be visible by default - check for actual content
    expect(screen.getByText("Layers")).toBeInTheDocument();
    expect(screen.getByText("Asset Details")).toBeInTheDocument();

    // Search input should be rendered
    expect(screen.getByLabelText("Search for layers...")).toBeInTheDocument();

    // Close button should be rendered
    expect(screen.getByLabelText("close layer panel")).toBeInTheDocument();
  });
});
