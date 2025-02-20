import { useContext, useEffect } from "react";
import { useQueries } from "@tanstack/react-query";

import { ElementsContext } from "@/context/ElementContext";
import { fetchFloodAreaPolygon } from "@/api/combined";

export default function useFloodAreaPolygons(selectedFloodAreas: string[]) {
  const { updateErrorNotifications } = useContext(ElementsContext);

  const query = useQueries({
    queries: selectedFloodAreas.map((polygonUri) => ({
      enabled: Boolean(polygonUri),
      queryKey: ["flood-area-polygon", polygonUri],
      queryFn: () =>
        fetchFloodAreaPolygon(polygonUri).then((data) => [
          polygonUri,
          data.features,
        ]),
    })),
    combine: (results) => ({
      data: Object.fromEntries(
        results.filter((result) => result.data).map((result) => result.data),
      ),
      isLoading: results.some((result) => result.isLoading),
      isSuccess: results.some((result) => result.isSuccess),
      isError: results.some((result) => result.isError),
      errors: results.map((result) => result.error),
    }),
  });

  useEffect(() => {
    if (query.isError) {
      query.errors.forEach((error) => updateErrorNotifications(error.message));
    }
  }, [query.isError, query.errors, updateErrorNotifications]);

  return {
    polygonFeatures: query.data,
    isLoading: query.isLoading,
    isSuccess: query.isSuccess,
  };
}
