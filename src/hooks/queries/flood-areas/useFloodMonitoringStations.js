import { useContext, useState } from "react";
import { useQuery } from "react-query";

import { ElementsContext } from "context";
import api from "../../../api";

const useFloodMonitoringStations = () => {
  const { updateErrorNotifications } = useContext(ElementsContext);
  const [showStations, setShowStations] = useState(false);

  const { fetchFloodMonitoringStations } = api.floodWatchAreas;

  const menuItem = {
    name: "Monitoring Stations",
    selected: showStations,
    type: "toggleSwitch",
    onItemClick: () => setShowStations((show) => !show),
  };

  const query = useQuery(
    "flood-monitoring-stations",
    () => fetchFloodMonitoringStations(),
    {
      enabled: showStations,
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
      onError: (error) => {
        updateErrorNotifications(error.message);
      },
    }
  );

  return { query, menuItem, showStations };
};

export default useFloodMonitoringStations;
