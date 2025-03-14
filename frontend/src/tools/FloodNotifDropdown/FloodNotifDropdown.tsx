import { useMemo, useRef } from "react";
import { useBoolean, useOnClickOutside } from "usehooks-ts";
import { useQuery } from "@tanstack/react-query";
import Link from "@mui/material/Link";
import FloodRiskAreas from "./FloodRiskAreas";
import styles from "./style.module.css";
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
        <div className={styles.floodPanel}>
          <FloodRiskAreas atRiskAreas={atRiskAreas} />
          <Link
            component="button"
            variant="body2"
            onClick={closeWidget}
            className={styles.closeButton}
          >
            Close
          </Link>
        </div>
      )}
    </div>
  );
}
export const SIDE_BUTTON_ORDER = 0;
