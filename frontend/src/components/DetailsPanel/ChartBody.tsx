import { ReactNode } from "react";
import {
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import dayjs from "dayjs";
import { useZoomChart } from "./useZoomChart";
import styles from "./chart.module.css";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: number;
  param: string;
  unit: string;
}

const labelFormatter = (date: number) => dayjs(date).format("D MMM YY, HH:mm");

const CustomTooltip = ({
  active,
  payload,
  label,
  param,
  unit,
}: CustomTooltipProps) => {
  if (active && payload?.length) {
    return (
      <div className={styles.tooltip}>
        <p className={styles.tooltipLabel}>{labelFormatter(label)}</p>
        <p
          className={styles.tooltipContent}
        >{`${param}: ${payload[0].value} ${unit}`}</p>
      </div>
    );
  }
  return null;
};

export interface ChartBodyProps<T> {
  data: T[];
  param: string;
  unit: string;
  className?: string;
  additionalChartElements?: ReactNode;
}

export default function ChartBody<T extends { time: string; value: number }>({
  data = [],
  param,
  unit,
  className,
  additionalChartElements,
}: ChartBodyProps<T>) {
  const validData = data.filter(
    (item) => item.time && item.value !== undefined,
  );

  const {
    zoomableData,
    rootElementProps,
    lineChartProps,
    xAxisProps,
    yAxisProps,
    ZoomAreaElement,
    ZoomOutButtonElement,
  } = useZoomChart({
    data: validData,
    referenceAreaProps: { stroke: "var(--col-primary)" },
    enabled: true,
  });

  return (
    <div
      className={`${styles.chartContainer} ${className}`}
      {...rootElementProps}
    >
      {ZoomOutButtonElement && (
        <button
          className={styles.zoomOutButton}
          onClick={ZoomOutButtonElement.props.onClick}
        >
          Zoom Out
        </button>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={zoomableData} {...lineChartProps}>
          <XAxis
            type="number"
            dataKey="milliseconds"
            {...xAxisProps}
            tick={{ fill: "var(--col-fg-secondary)" }}
          />
          <YAxis
            type="number"
            {...yAxisProps}
            tick={{ fill: "var(--col-fg-secondary)" }}
          />
          <Tooltip content={<CustomTooltip param={param} unit={unit} />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--col-primary)"
            dot={false}
            animationDuration={300}
          />
          {ZoomAreaElement}
          {additionalChartElements}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
