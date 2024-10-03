import WeatherChart from "./chart/WeatherChart";
import useHydroTidesWeatherStore from "@/components/DetailsPanel/useHydroTidesWeatherStore";
import DetailsPanel from "@/components/DetailsPanel/DetailsPanel";
import styles from "@/tools/Hydrology/style.module.css";
import { WeatherStation } from "@/api/weather";

export default function WeatherDetailPanel() {
  const { selectedStation, deselectStation } = useHydroTidesWeatherStore();

  const handleClose = () => {
    deselectStation();
  };

  if (!selectedStation || selectedStation.type !== "weather") {
    return null;
  }

  const weatherStation = selectedStation.data as WeatherStation;

  return (
    <DetailsPanel isOpen={true} onClose={handleClose}>
      <div className={styles.hydrologyDetails}>
        <h2>
          <strong>Temperature:</strong> {weatherStation.name}
        </h2>
        <WeatherChart
          name={weatherStation.name}
          latitude={weatherStation.latitude}
          longitude={weatherStation.longitude}
          className={styles.hydrologyStationMeasureData}
        />
      </div>
    </DetailsPanel>
  );
}
