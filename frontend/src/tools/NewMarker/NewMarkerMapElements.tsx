import { Marker } from "react-map-gl/maplibre";
import { useMousePositionStore } from "./useStore";

export default function NewMarkerMapElements() {
  const mousePosition = useMousePositionStore((state) => state.mousePosition);

  return mousePosition ? <Marker {...mousePosition} /> : null;
}
