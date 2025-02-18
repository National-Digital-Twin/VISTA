import { useMemo, useRef } from "react";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { useBoolean, useOnClickOutside } from "usehooks-ts";
import { useQuery } from "@tanstack/react-query";
import styles from "./style.module.css";
import FloodRiskAreas from "./FloodRiskAreas";
import { fetchAllLiveStations } from "@/api/hydrology";

export default function FloodNotifDropdown() {
  const {
    value: isOpen,
    setFalse: closeWidget,
    toggle: toggleWidget,
  } = useBoolean(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  const { data: floodWarnings } = useQuery({
    queryKey: ["floodWarnings"],
    queryFn: async () => {
      console.log("fetching flood warnings");
      const geoJsonData = await fetchAllLiveStations();
      console.log("fetched flood warnings:", geoJsonData.features.length);
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
      <button
        className={classNames(
          "bg-button hover:bg-button p-2 rounded cursor-pointer flex items-center justify-center w-9 h-9 border-none transition-colors duration-300",
          { "bg-button-hover": isOpen },
        )}
        onClick={toggleWidget}
      >
        <FontAwesomeIcon icon={faBell} className="text-whiteSmoke" />
        {atRiskAreas.length > 0 && (
          <span className={styles.warningCount}>{atRiskAreas.length}</span>
        )}
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-card border border-neutral-outline rounded p-4 shadow-lg w-[350px] max-h-[40vh] overflow-y-auto">
          <FloodRiskAreas atRiskAreas={atRiskAreas} />
        </div>
      )}
    </div>
  );
}
