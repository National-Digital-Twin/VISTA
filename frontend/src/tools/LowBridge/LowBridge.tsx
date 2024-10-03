import { Marker } from "react-map-gl";
import { useQuery } from "@tanstack/react-query";
import { fetchLowBridges } from "@/api/paralog-python";
import useLayer from "@/hooks/useLayer";
import featureFlags from "@/config/feature-flags";

export default function LowBridge() {
  const { enabled: layerEnabled } = useLayer("low-bridges");
  const enabled = layerEnabled || !featureFlags.uiNext;

  const { data } = useQuery({
    queryKey: ["bridges"],
    queryFn: () => fetchLowBridges(),
    enabled: enabled,
  });

  if (!enabled) {
    return null;
  }

  return (
    <>
      {data?.map((item) => (
        <Marker
          key={item.localId}
          longitude={item.longitude}
          latitude={item.latitude}
          style={{
            cursor: "pointer",
            border: "",
            borderRadius: "10px",
          }}
        />
      ))}
    </>
  );
}
