import { useContext, useMemo } from "react";
import { useQueries } from "react-query";

import { ElementsContext } from "context";
import { fetchFloodAreaPolygon } from "endpoints";

const useFloodAreaPolygons = (selectedFloodAreas) => {
  const { updateErrorNotifications } = useContext(ElementsContext);
  const getFeatures = (data) => data.features;

  const queries = useQueries(
    selectedFloodAreas.map((polygonUri) => {
      return {
        queryKey: ["flood-area-polygon", polygonUri],
        queryFn: () => fetchFloodAreaPolygon(polygonUri),
        select: getFeatures,
        onError: (error) => {
          updateErrorNotifications(error.message);
        },
      };
    })
  );

  const isLoading = useMemo(() => queries.some((query) => query.isLoading), [queries]);
  const isSuccess = useMemo(() => queries.some((query) => query.isSuccess), [queries]);
  const polygonFeatures = useMemo(
    () => queries.filter((query) => query.data).flatMap((query) => query.data),
    [queries]
  );

  return {
    polygonFeatures,
    isLoading,
    isSuccess,
  };
};

export default useFloodAreaPolygons;
