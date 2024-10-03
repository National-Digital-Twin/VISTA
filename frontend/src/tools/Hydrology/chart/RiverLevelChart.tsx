import { ReferenceLine } from "recharts";
import { useHydrologyReadings } from "@/tools/Hydrology/useHydrologyReadings";
import Chart from "@/components/DetailsPanel/Chart";

export interface RiverLevelChartProps {
  name: string;
  parameter: string;
  param: string;
  uri: string;
  startDate: Date;
  endDate: Date;
  className?: string;
}

const getUnit = (param: string) => {
  switch (param) {
    case "rainfall":
      return "mm";
    case "river flow":
      return "m³/s";
    case "river level":
      return "m";
    case "groundwater":
    case "groundwater-dipped":
      return "mAOD";
    default:
      return "";
  }
};

export default function RiverLevelChart({
  name,
  parameter,
  param,
  uri,
  startDate,
  endDate,
  className,
}: RiverLevelChartProps) {
  const { data, isLoading, isError } = useHydrologyReadings(
    uri,
    startDate,
    endDate,
  );

  const additionalChartElements = (
    <ReferenceLine
      y={0.4}
      stroke="var(--col-danger)"
      strokeDasharray="3 3"
      label={{
        value: "normal range",
        fill: "var(--col-fg-secondary)",
        fontSize: 12,
        position: "end",
      }}
    />
  );

  return (
    <Chart
      name={name}
      rawData={data}
      isLoading={isLoading}
      isError={isError}
      parameter={parameter}
      getUnit={() => getUnit(param)}
      dataTransform={(item) => ({
        time: item.time || "",
        value: typeof item.value === "number" ? item.value : 0,
      })}
      className={className}
      additionalChartElements={additionalChartElements}
    />
  );
}
