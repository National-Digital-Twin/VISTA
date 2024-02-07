import { useQuery } from "@tanstack/react-query";
import { fetchAllFloodAreas } from "api/combined";

const useFloodWatchAreas = () => {
  const generateFloodAreaNodes = (data) => {
    const nodes = data.map((floodWatchArea) => {
      const floodWatchAreaUri = floodWatchArea?.uri;
      const floodWatchAreaPolygonUri = floodWatchArea?.polygon_uri;
      const floodWatchAreaName = floodWatchArea?.name || floodWatchArea?.uri;

      if (!floodWatchAreaPolygonUri)
        throw new Error(`Flood watch area polygon for ${floodWatchAreaUri} is not defined`);

      const children = (floodWatchArea?.flood_areas || []).map((floodArea) => {
        const floodAreaPolygonUri = floodArea?.polygon_uri || undefined;
        const floodAreaName = floodArea?.name || floodArea?.uri;

        if (!floodAreaPolygonUri)
          throw new Error(`Flood area polygon for ${floodWatchAreaUri} is not defined`);
        return {
          value: floodAreaPolygonUri,
          label: floodAreaName,
        };
      });

      return {
        value: floodWatchAreaPolygonUri,
        label: floodWatchAreaName,
        children,
      };
    });
    return nodes;
  };

  const { isLoading, isError, error, data } = useQuery({
    queryKey: ["flood-watch-areas"],
    queryFn: fetchAllFloodAreas,
    select: generateFloodAreaNodes,
  });
  return { isLoading, isError, error, data };
};

export default useFloodWatchAreas;
