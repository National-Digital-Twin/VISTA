import ChartBody from "@/components/DetailsPanel/ChartBody";

export interface WeatherChartBodyProps {
  /** Data being rendered */
  data: Array<{ time: string; screenTemperature: number }>;
  /** Item which is being plotted */
  param: string;
  /** Unit of the parameter being plotted */
  unit: string;
  /** Additional classes to add to the top-level element */
  className?: string;
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
