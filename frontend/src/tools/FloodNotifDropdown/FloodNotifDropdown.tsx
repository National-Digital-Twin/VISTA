import { useMemo, useRef } from "react";
import { useBoolean, useOnClickOutside } from "usehooks-ts";
import { useQuery } from "@tanstack/react-query";
import FloodRiskAreas from "./FloodRiskAreas";
import { fetchAllLiveStations } from "@/api/hydrology";
import ToolbarButton from "@/components/Map/SideButtons/ToolbarButton";

export default function SideButtons() {
  const {
    value: isOpen,
    setFalse: closeWidget,
    toggle: toggleWidget,
  } = useBoolean(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  const { data: floodWarnings } = useQuery({
    queryKey: ["floodWarnings"],
    queryFn: async () => {
      const geoJsonData = await fetchAllLiveStations();
      return geoJsonData.features;
    },
  });

  const atRiskAreas = useMemo(() => {
    if (!floodWarnings || floodWarnings.length === 0) {
      return [];
    }
    return floodWarnings.filter(
      (station) => station.properties.atrisk === true,
    );
  }, [floodWarnings]);

  useOnClickOutside(widgetRef, closeWidget);

  return (
    <div className="pointer-events-auto relative" ref={widgetRef}>
      <ToolbarButton
        title="Flood Notifications"
        onClick={toggleWidget}
        svgSrc="/icons/Warning.svg"
        badgeContent={atRiskAreas.length}
      />
      {isOpen && (
        <div className="absolute top-0 right-0 pr-10 mt-2 mr-20 bg-card border border-neutral-outline rounded p-4 shadow-lg w-[350px] max-h-[40vh] overflow-y-auto">
          <FloodRiskAreas atRiskAreas={atRiskAreas} />
        </div>
      )}
    </div>
  );
}
export const SIDE_BUTTON_ORDER = 0;
