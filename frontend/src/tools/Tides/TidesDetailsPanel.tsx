import TidesChart from "./chart/TidesChart";
import SummaryInfo from "./chart/SummaryInfo";
import { useTideData } from "./useTideData";
import styles from "./style.module.css";
import useHydroTidesWeatherStore from "@/components/DetailsPanel/useHydroTidesWeatherStore";
import DetailsPanel from "@/components/DetailsPanel/DetailsPanel";

export default function TidesDetailPanel() {
  const { selectedStation, deselectStation } = useHydroTidesWeatherStore();

  const { tideData, tideDataLoading, tideDataError } = useTideData(
    selectedStation?.type === "tides" ? selectedStation.data.id : null,
  );

  const handleClose = () => {
    deselectStation();
  };

  if (!selectedStation || selectedStation.type !== "tides") {
    return null;
  }

  return (
    <DetailsPanel isOpen={true} onClose={handleClose}>
      <div className={styles.tidesDetailsPanelContent}>
        <h2>
          <strong>Tides:</strong> {selectedStation.data.name}
        </h2>
        {tideDataLoading && <p>Loading tide data...</p>}
        {tideDataError && (
          <p>Error loading tide data. Please try again later.</p>
        )}
        {tideData && (
          <div className={styles.tidesContent}>
            <SummaryInfo />
            <TidesChart className={styles.tidesChart} />
          </div>
        )}
      </div>
    </DetailsPanel>
  );
}
