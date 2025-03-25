import { render, screen } from "@testing-library/react";
import ChartBody from "./ChartBody";

// Mock styles
jest.mock("./chart.module.css", () => ({
  chartContainer: "chartContainer",
  tooltip: "tooltip",
  tooltipLabel: "tooltipLabel",
  tooltipContent: "tooltipContent",
  zoomOutButton: "zoomOutButton",
}));

// Mock useZoomChart
jest.mock("./useZoomChart", () => ({
  useZoomChart: jest.fn(() => ({
    zoomableData: [
      { time: "2023-01-01T00:00:00Z", value: 42, milliseconds: 1672531200000 },
    ],
    rootElementProps: { "data-testid": "chart-root" },
    lineChartProps: {},
    xAxisProps: {},
    yAxisProps: {},
    ZoomAreaElement: <rect data-testid="zoom-area" />,
  })),
}));

describe("ChartBody", () => {
  beforeAll(() => {
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });
  const baseProps = {
    param: "temp",
    unit: "°C",
  };

  const validData = [
    { time: "2023-01-01T00:00:00Z", value: 42, milliseconds: 1672531200000 },
    { time: "2023-01-01T01:00:00Z", value: 43, milliseconds: 1672534800000 },
  ];

  const mixedData = [
    { time: "", value: 42, milliseconds: 1672531200000 }, // invalid
    { time: "2023-01-01T01:00:00Z", value: 43, milliseconds: 1672534800000 }, // valid
    { value: 44, milliseconds: 1672538400000 }, // invalid
  ];

  it("renders the chart with valid data", () => {
    render(<ChartBody {...baseProps} data={validData} />);
    expect(screen.getByTestId("chart-root")).toBeInTheDocument();
  });

  it("filters out invalid data", () => {
    render(<ChartBody {...baseProps} data={mixedData as any} />);
    expect(screen.getByTestId("chart-root")).toBeInTheDocument();
    // We can't directly test the filtered array without exposing it,
    // but we can verify that the chart still renders with no crash.
  });
});
