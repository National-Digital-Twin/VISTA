import { useQuery } from "@tanstack/react-query";
import { fetchFloodTimeline } from "api/combined";

const sortByDate = (a, b) => {
  a = a.period.toString().split("/");
  b = b.period.toString().split("/");
  return b[2] - a[2] || b[1] - a[1] || b[0] - a[0];
};

const useFloodTimeline = (areaCode) => {
  return useQuery({
    queryKey: ["floodTimeline", areaCode],
    queryFn: () => fetchFloodTimeline(areaCode),
    enabled: !!areaCode,
    select: (data) => {
      const timelineData = Object.values(data)
        .map((item) => {
          const timelineData = {
            period: item.period.split("-").reverse().join("/"),
            floodSeverityLevel: item.representations.map(
              (representation) =>
                representation[
                  "http://ies.data.gov.uk/ontology/ies4#EnvironmentAgencyFloodSeverityLevel"
                ]
            ),
          };
          return timelineData;
        })
        .sort(sortByDate);
      return timelineData;
    },
  });
};

export default useFloodTimeline;
