import { Marker } from "react-map-gl/maplibre";
import { useEffect } from "react";
import { useEditSandbags } from "./useSandbag";
import useStore from "./useStore";
import useLayer from "@/hooks/useLayer";

export default function Sandbag() {
  const { enabled } = useLayer("sandbag");

  const mousePosition = useStore((state) => state.mousePosition);

  const { query, executeQuery, onMarkerClick, onMarkerDragEnd } =
    useEditSandbags();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    executeQuery();
  }, [enabled, executeQuery]);

  if (!enabled) {
    return null;
  }

  return (
    <>
      {mousePosition ? <Marker {...mousePosition} /> : null}
      {query.data?.sandbagPlacements.map((item) => (
        <Marker
          key={item.id}
          longitude={item.longitude}
          latitude={item.latitude}
          draggable
          onDragEnd={(event) => onMarkerDragEnd(event, item)}
          onClick={() => onMarkerClick(item)}
        />
      ))}
    </>
  );
}
