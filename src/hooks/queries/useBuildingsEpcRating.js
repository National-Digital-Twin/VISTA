import { useContext, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { ElementsContext } from "context";
import { fetchBuildingsEpcRating } from "api/combined";
import { getURIFragment } from "utils";

const getEPCLetter = (str) => {
  const epcLetter = str.charAt(str.length - 1);
  return epcLetter;
};

const useBuildingsEpcRating = () => {
  const { updateErrorNotifications } = useContext(ElementsContext);
  const [showBuildings, setshowBuildings] = useState(false);

  const menuItem = {
    name: "EPC Ratings",
    selected: showBuildings,
    type: "toggleSwitch",
    onItemClick: () => setshowBuildings((show) => !show),
  };

  const query = useQuery({
    enabled: showBuildings,
    queryKey: ["buildings-epc-rating"],
    queryFn: fetchBuildingsEpcRating,
    select: (data) => {
      return data.map(({ uprn, epc_rating, name, lon, lat }) => ({
        type: "Feature",
        properties: {
          cluster: false,
          id: uprn,
          label: name,
          epcLetter: getEPCLetter(epc_rating),
          epcRating: getURIFragment(epc_rating),
        },
        geometry: {
          type: "Point",
          coordinates: [lon, lat],
        },
      }));
    },
    onError: (error) => {
      updateErrorNotifications(error.message);
    },
  });

  return { query, menuItem, showBuildings };
};

export default useBuildingsEpcRating;
