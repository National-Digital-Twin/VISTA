import { Marker } from "react-map-gl/maplibre";
import { useTideData } from "./useTideData";
import useHydroTidesWeatherStore from "@/components/DetailsPanel/useHydroTidesWeatherStore";
import { TideStation } from "@/api/tides";
import useLayer from "@/hooks/useLayer";

export default function TideStations() {
  const { enabled } = useLayer("tides");
  const { selectStation, selectedStation } = useHydroTidesWeatherStore();
  const { stations } = useTideData(
    selectedStation?.type === "tides" ? selectedStation.data.id : null,
  );

  if (!enabled || !stations) {
    return null;
  }

  const handleStationClick = (station: TideStation) => {
    selectStation({ type: "tides", data: station });
  };

  return (
    <>
      {stations.map((station) => (
        <Marker
          key={station.id}
          longitude={station.longitude}
          latitude={station.latitude}
          onClick={() => handleStationClick(station)}
          style={{
            cursor: "pointer",
            border:
              selectedStation?.type === "tides" &&
              selectedStation.data.id === station.id
                ? "1px solid yellow"
                : "",
            borderRadius: "10px",
          }}
        />
      ))}
    </>
  );
}
