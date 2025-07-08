import { useQuery } from "@tanstack/react-query";
import { fetchTideStations, fetchTideData } from "@/api/tides";

export function useTideData(selectedStationId: string | null) {
  const stationsQuery = useQuery({
    queryKey: ["get-tide-stations"],
    queryFn: fetchTideStations,
  });

  const tideDataQuery = useQuery({
    queryKey: ["get-tide-data", selectedStationId],
    queryFn: () => fetchTideData(selectedStationId),
    enabled: !!selectedStationId,
  });

  return {
    stations: stationsQuery.data,
    stationsLoading: stationsQuery.isLoading,
    stationsError: stationsQuery.isError,
    tideData: tideDataQuery.data,
    tideDataLoading: tideDataQuery.isLoading,
    tideDataError: tideDataQuery.isError,
  };
}
