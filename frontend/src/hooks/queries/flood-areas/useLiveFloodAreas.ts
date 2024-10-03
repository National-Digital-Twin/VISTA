import { useQuery } from "@tanstack/react-query";
import { fetchLiveFloodAreas } from "@/api/combined";

const useLiveFloodAreas = () =>
  useQuery({
    queryKey: ["live-flood-areas"],
    queryFn: fetchLiveFloodAreas,
    placeholderData: [],
  });

export default useLiveFloodAreas;
