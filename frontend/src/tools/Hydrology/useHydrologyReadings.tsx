import { useQuery } from "@tanstack/react-query";
import {
  fetchMostRecentReading,
  fetchReadings,
  fetchStationGeoJson,
} from "@/api/hydrology";

interface HydrologyReading {
  time: string;
  value: number;
}

export function useLatestHydrologyReading(measureUrl: string) {
  return useQuery({
    queryKey: ["hydrology-measure-latest", measureUrl],
    queryFn: async () => {
      const payload = await fetchMostRecentReading(measureUrl);
      return payload?.items?.length && payload.items[0];
    },
  });
}

export function useHydrologyReadings(
  measureUrl: string,
  startDate: Date,
  endDate: Date,
) {
  return useQuery<HydrologyReading[], Error>({
    queryKey: [
      "hydrology-measure-readings",
      measureUrl,
      startDate.toString(),
      endDate.toString(),
    ],
    queryFn: async () => {
      const payload = await fetchReadings(measureUrl, startDate, endDate);
      return (
        payload?.items?.map((item) => ({
          time: item.dateTime,
          value: item.value,
        })) || []
      );
    },
  });
}

// export const useStationDetail = (id,skip) => useQuery({
//   queryKey: ["station-detail", id],
//   enabled:!skip,
//   queryFn: async () => {
//     return await fetchStationDetail(id);
//   }
// });
export function useStationRiverLevelGeoJson(skip: boolean) {
  return useQuery({
    queryKey: ["station-river-level-detail"],
    enabled: !skip,
    queryFn: async () => {
      return await fetchStationGeoJson();
    },
  });
}
