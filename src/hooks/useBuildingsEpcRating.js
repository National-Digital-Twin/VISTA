import { useContext, useState } from "react";
import { useQuery } from "react-query";

import { ElementsContext } from "context";
import { fetchBuildingsEpcRating } from "endpoints";
import { getURIFragment } from "utils";

const getEPCLetter = (str) => {
  const epcLetter = str.charAt(str.length - 1);
  return epcLetter;
};

const useBuildingsEpcRating = () => {
  const { updateErrorNotifications } = useContext(ElementsContext);
  const [showBuildings, setshowBuildings] = useState(false);

  const menuItem = {
    name: "Buildings Epc Rating",
    selected: showBuildings,
    type: "toggleSwitch",
    onItemClick: () => setshowBuildings((show) => !show),
  };

  const query = useQuery("buildings-epc-rating", () => fetchBuildingsEpcRating(), {
    enabled: showBuildings,
    select: (data) => {
      return data.map((building) => {
        return {
          type: "Feature",
          properties: {
            id: building.uprn,
            label: building.name,
            epc_letter: getEPCLetter(building.epc_rating),
            epc: getURIFragment(building.epc_rating),
          },
          geometry: {
            type: "Point",
            coordinates: [building.lon, building.lat],
          },
        };
      });
    },
    onError: (error) => {
      updateErrorNotifications(error.message);
    },
  });

  return { query, menuItem, showBuildings };
};

export default useBuildingsEpcRating;
