import { useContext, useEffect } from "react";
import { useQueries } from "@tanstack/react-query";

import { ElementsContext } from "context";
import { fetchFloodAreaPolygon } from "api/combined";

const useFloodAreaPolygons = (selectedFloodAreas) => {
  const { updateErrorNotifications } = useContext(ElementsContext);
  const getFeatures = (data) => data.features;

  const query = useQueries({
    queries: selectedFloodAreas.map((polygonUri) => ({
      enabled: Boolean(polygonUri),
      queryKey: ["flood-area-polygon", polygonUri],
      queryFn: () => fetchFloodAreaPolygon(polygonUri),
      select: getFeatures,
    })),
    combine: (results) => ({
      data: results.filter((result) => result.data).flatMap((result) => result.data),
      isLoading: results.some((result) => result.isLoading),
      isSuccess: results.some((result) => result.isSuccess),
      isError: results.some((result) => result.isError),
      errors: results.map((result) => result.error),
    }),
  });

  useEffect(() => {
    if (query.isError) {
      query.errors.map((error) => updateErrorNotifications(error.message));
    }
  }, [query.isError, query.errors, updateErrorNotifications]);

  return {
    polygonFeatures: query.data,
    isLoading: query.isLoading,
    isSuccess: query.isSuccess,
  };
};

export default useFloodAreaPolygons;
