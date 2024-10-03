import { useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { ElementsContext } from "@/context/ElementContext";
import { fetchFloodMonitoringStations } from "@/api/combined";

export default function useFloodMonitoringStations() {
  const { updateErrorNotifications, dismissErrorNotification } =
    useContext(ElementsContext);
  const [showStations, setShowStations] = useState(false);

  const menuItem: {
    name: string;
    selected: boolean;
    type: "toggleSwitch";
    onItemClick: () => void;
  } = {
    name: "Monitoring Stations",
    selected: showStations,
    type: "toggleSwitch",
    onItemClick: () => setShowStations((show) => !show),
  };

  const query = useQuery({
    enabled: showStations,
    queryKey: ["flood-monitoring-stations"],
    queryFn: () => fetchFloodMonitoringStations(),
    select: (data) => {
      return data.items.map((monitoringStation) => {
        return {
          type: "Feature",
          properties: {
            id: monitoringStation["@id"],
            label: monitoringStation.label,
          },
          geometry: {
            type: "Point",
            coordinates: [monitoringStation.long, monitoringStation.lat],
          },
        };
      });
    },
  });

  const isError = query.isError;
  const errorMessage = query.error?.message;

  useEffect(() => {
    if (isError) {
      updateErrorNotifications(errorMessage);
      return () => {
        dismissErrorNotification(errorMessage);
      };
    }
  }, [
    isError,
    errorMessage,
    updateErrorNotifications,
    dismissErrorNotification,
  ]);

  return { query, menuItem, showStations };
}
