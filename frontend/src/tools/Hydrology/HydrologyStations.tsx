import { Marker } from "react-map-gl";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import useHydrologyStore from "./useStore";
import useHydroTidesWeatherStore from "@/components/DetailsPanel/useHydroTidesWeatherStore";
import { fetchStations, HydrologyStation } from "@/api/hydrology";

export default function HydrologyStations() {
  const { selectStation, selectedStation } = useHydroTidesWeatherStore();
  const selectedStationTypes = useHydrologyStore(
    (state) => state.selectedStationTypes,
  );
  const { data } = useQuery({
    queryKey: ["get-hydrology-stations"],
    queryFn: () => fetchStations(),
  });

  const visibleMonitoringStations = useMemo(() => {
    if (!data) {
      return [];
    }
    return data.filter((item) =>
      item.types.some((typeId) => selectedStationTypes[typeId]),
    );
  }, [data, selectedStationTypes]);

  const handleStationClick = (station: HydrologyStation) => {
    selectStation({ type: "hydrology", data: station });
  };

  return (
    <>
      {visibleMonitoringStations.map((item) => (
        <Marker
          key={item.id}
          longitude={item.longitude}
          latitude={item.latitude}
          onClick={() => handleStationClick(item)}
          style={{
            cursor: "pointer",
            border:
              selectedStation?.type === "hydrology" &&
              selectedStation.data.id === item.id
                ? "1px solid yellow"
                : "",
            borderRadius: "10px",
          }}
        />
      ))}
    </>
  );
}
