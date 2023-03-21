import { useQuery } from "react-query";
import { fetchAllFloodAreas } from "endpoints";

const useFloodWatchAreas = () => {
  const floodWatchAreas = useQuery("flood-watch-areas", () => fetchAllFloodAreas());
  return floodWatchAreas;
};

export default useFloodWatchAreas;
