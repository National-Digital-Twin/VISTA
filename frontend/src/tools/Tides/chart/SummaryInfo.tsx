import React from "react";
import dayjs from "dayjs";
import { useTideData } from "../useTideData";
import styles from "./chart.module.css";
import useHydroTidesWeatherStore from "@/components/DetailsPanel/useHydroTidesWeatherStore";
import { TideEvent } from "@/api/tides";

const TideInfo: React.FC<{ tide: TideEvent; label: string }> = ({
  tide,
  label,
}) => (
  <div className={styles.tideInfo}>
    <h3>{label}</h3>
    <p>Height: {tide.height.toFixed(2)} m</p>
    <p>Time: {dayjs(tide.time).format("D MMM YYYY, HH:mm")}</p>
  </div>
);

const SummaryInfo: React.FC = () => {
  const { selectedStation } = useHydroTidesWeatherStore();
  const { tideData } = useTideData(
    selectedStation?.type === "tides" ? selectedStation.data.id : null,
  );

  if (!tideData) {
    return <p>Loading summary...</p>;
  }

  const lastLowTide = tideData.pastTides.findLast(
    (tide) => tide.type === "LowWater",
  );
  const lastHighTide = tideData.pastTides.findLast(
    (tide) => tide.type === "HighWater",
  );
  const nextLowTide = tideData.futureTides.find(
    (tide) => tide.type === "LowWater",
  );
  const nextHighTide = tideData.futureTides.find(
    (tide) => tide.type === "HighWater",
  );

  return (
    <div className={styles.summaryInfo}>
      <h2>Tide Summary</h2>
      {lastLowTide && <TideInfo tide={lastLowTide} label="Previous Low Tide" />}
      {lastHighTide && (
        <TideInfo tide={lastHighTide} label="Previous High Tide" />
      )}
      {nextLowTide && <TideInfo tide={nextLowTide} label="Next Low Tide" />}
      {nextHighTide && <TideInfo tide={nextHighTide} label="Next High Tide" />}
    </div>
  );
};

export default SummaryInfo;
