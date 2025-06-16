import { Marker } from "react-map-gl/maplibre";
import { useTooltips } from "./TooltipContext";

export const TooltipOverlay = () => {
  const { tooltips } = useTooltips();

  return (
    <>
      {Object.entries(tooltips).map(([id, { center, area }]) => (
        <Marker key={id} longitude={center[0]} latitude={center[1]}>
          <div
            style={{
              padding: "4px 8px",
              background: "white",
              borderRadius: "4px",
              border: "1px solid black",
              fontSize: 12,
              pointerEvents: "none",
            }}
          >
            {area.toFixed(2)} km²
          </div>
        </Marker>
      ))}
    </>
  );
};
