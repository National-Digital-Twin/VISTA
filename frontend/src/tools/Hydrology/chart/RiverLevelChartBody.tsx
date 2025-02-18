import { ReferenceLine } from "recharts";
import ChartBody from "@/components/DetailsPanel/ChartBody";

export interface RiverLevelChartBodyProps<
  Data extends { time: string; value: number },
> {
  readonly data: Data[];
  readonly param: string;
  readonly unit: string;
  readonly className?: string;
}

export default function RiverLevelChartBody<
  Data extends { time: string; value: number },
>({ data, param, unit, className }: RiverLevelChartBodyProps<Data>) {
  const additionalChartElements = (
    <ReferenceLine
      y={0.4} // fetch value or remove reference line
      stroke="var(--col-danger)"
      strokeDasharray="3 3"
      label={{
        value: "normal range",
        fill: "var(--col-fg-secondary)",
        fontSize: 12,
      }}
      position="end"
    />
  );

  return (
    <ChartBody
      data={data}
      param={param}
      unit={unit}
      className={className}
      additionalChartElements={additionalChartElements}
    />
  );
}
