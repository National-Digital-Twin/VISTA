import { render, screen, waitFor } from "@testing-library/react";
import Chart from "./Chart";

type SampleData = { timestamp: string; reading: number };

describe("Chart component", () => {
  const name = "Temperature Sensor";
  const parameter = "temp";
  const unit = "°C";

  const sampleData: SampleData[] = [
    { timestamp: "2023-01-01T00:00:00Z", reading: 22 },
    { timestamp: "2023-01-01T01:00:00Z", reading: 23 },
  ];

  const getUnit = jest.fn((param: string) => (param === "temp" ? unit : ""));
  const dataTransform = jest.fn((item: SampleData) => ({
    time: item.timestamp,
    value: item.reading,
  }));

  const baseProps = {
    name,
    parameter,
    getUnit,
    dataTransform,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading message when isLoading is true", () => {
    render(<Chart {...baseProps} rawData={[]} isLoading isError={false} />);
    expect(
      screen.getByText(`Loading ${parameter} data for ${name}`),
    ).toBeInTheDocument();
  });

  it("shows error message when isError is true", () => {
    render(<Chart {...baseProps} rawData={[]} isLoading={false} isError />);
    expect(
      screen.getByText(`Error loading ${parameter} data for ${name}`),
    ).toBeInTheDocument();
  });

  it("renders ChartBody with transformed data and unit", async () => {
    render(
      <Chart
        {...baseProps}
        rawData={sampleData}
        isLoading={false}
        isError={false}
      />,
    );

    await waitFor(() => {
      expect(getUnit).toHaveBeenCalledWith(parameter);
      expect(dataTransform).toHaveBeenCalledTimes(sampleData.length);
    });
  });
});
