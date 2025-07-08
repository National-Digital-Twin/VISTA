import { Marker } from "react-map-gl/maplibre";
import WEATHER_STATIONS from "./weather-stations.json";
import useHydroTidesWeatherStore from "@/components/DetailsPanel/useHydroTidesWeatherStore";
import { WeatherStation } from "@/api/weather";
import useLayer from "@/hooks/useLayer";

export default function WeatherStations() {
  const { enabled } = useLayer("weather");
  const { selectStation } = useHydroTidesWeatherStore();

  if (!enabled) {
    return null;
  }

  const handleStationClick = (
    name: string,
    coords: { latitude: string; longitude: string },
  ) => {
    const station: WeatherStation = {
      id: name,
      name,
      latitude: coords.latitude,
      longitude: coords.longitude,
    };
    selectStation({ type: "weather", data: station });
  };

  return (
    <>
      {Object.entries(WEATHER_STATIONS).map(([name, coords]) => (
        <Marker
          key={name}
          longitude={parseFloat(coords.longitude)}
          latitude={parseFloat(coords.latitude)}
          onClick={() => handleStationClick(name, coords)}
          style={{
            cursor: "pointer",
            border: "",
            borderRadius: "10px",
          }}
        />
      ))}
    </>
  );
}
