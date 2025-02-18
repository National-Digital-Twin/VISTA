import { useTideData } from "../useTideData";
import styles from "./chart.module.css";
import useHydroTidesWeatherStore from "@/components/DetailsPanel/useHydroTidesWeatherStore";
import Chart from "@/components/DetailsPanel/Chart";

export interface TidesChartProps {
  readonly className?: string;
}

export default function TidesChart({ className }: TidesChartProps) {
  const { selectedStation } = useHydroTidesWeatherStore();
  const { tideData, tideDataLoading, tideDataError } = useTideData(
    selectedStation?.type === "tides" ? selectedStation.data.id : null,
  );

  const combinedTides = tideData
    ? [...tideData.pastTides, ...tideData.futureTides].sort(
        (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
      )
    : [];

  return (
    <div className={`${styles.chartWrapper} ${className}`}>
      <Chart
        name={
          selectedStation?.type === "tides" ? selectedStation.data.name : ""
        }
        rawData={combinedTides}
        isLoading={tideDataLoading}
        isError={tideDataError}
        parameter="Tide Height"
        getUnit={() => "m"}
        dataTransform={(item) => ({ time: item.time, value: item.height })}
        className={styles.chart}
      />
    </div>
  );
}
