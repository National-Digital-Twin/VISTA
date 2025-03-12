import ChartBody from "@/components/DetailsPanel/ChartBody";

export interface WeatherChartBodyProps {
  /** Data being rendered */
  readonly data: Array<{ time: string; screenTemperature: number }>;
  /** Item which is being plotted */
  readonly param: string;
  /** Unit of the parameter being plotted */
  readonly unit: string;
  /** Additional classes to add to the top-level element */
  readonly className?: string;
}

export default function WeatherChartBody({
  data = [],
  param,
  unit,
  className,
}: WeatherChartBodyProps) {
  const chartData = data.map((item) => ({
    time: item.time,
    value: item.screenTemperature,
  }));

  return (
    <ChartBody
      data={chartData}
      param={param}
      unit={unit}
      className={className}
    />
  );
}
