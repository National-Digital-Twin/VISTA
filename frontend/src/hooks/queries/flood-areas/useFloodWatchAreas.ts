import { useQuery } from "@tanstack/react-query";
import { fetchAllFloodAreas } from "@/api/combined";

export type FloodWatchArea = {
  value: string;
  label: string;
  children: Omit<FloodWatchArea, "children">[];
};

const useFloodWatchAreas = () => {
  const generateFloodAreaNodes = (data: any): FloodWatchArea[] => {
    const nodes = data.map((floodWatchArea: any) => {
      const floodWatchAreaUri = floodWatchArea?.uri;
      const floodWatchAreaPolygonUri = floodWatchArea?.polygon_uri;
      const floodWatchAreaName = floodWatchArea?.name || floodWatchArea?.uri;

      if (!floodWatchAreaPolygonUri) {
        throw new Error(
          `Flood watch area polygon for ${floodWatchAreaUri} is not defined`,
        );
      }

      const children = (floodWatchArea?.flood_areas ?? []).map(
        (floodArea: any) => {
          const floodAreaPolygonUri = floodArea?.polygon_uri || undefined;
          const floodAreaName = floodArea?.name || floodArea?.uri;

          if (!floodAreaPolygonUri) {
            throw new Error(
              `Flood area polygon for ${floodWatchAreaUri} is not defined`,
            );
          }
          return {
            value: floodAreaPolygonUri,
            label: floodAreaName,
          };
        },
      );

      return {
        value: floodWatchAreaPolygonUri,
        label: floodWatchAreaName,
        children,
      };
    });
    return nodes;
  };

  const { isError, error, data } = useQuery({
    queryKey: ["flood-watch-areas"],
    queryFn: fetchAllFloodAreas,
    select: generateFloodAreaNodes,
  });
  return { isError, error, data };
};

export default useFloodWatchAreas;
