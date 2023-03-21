import { useQuery } from "react-query";
import { fetchAllFloodAreas } from "endpoints";

const useFloodWatchAreas = () => {
  const { isLoading, isError, error, data } = useQuery("flood-watch-areas", () =>
    fetchAllFloodAreas()
  );

  const generateFloodAreaNodes = () => {
    const nodes = (data || []).map((floodWatchArea) => {
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
  return { isLoading, isError, error, generateFloodAreaNodes };
};

export default useFloodWatchAreas;
