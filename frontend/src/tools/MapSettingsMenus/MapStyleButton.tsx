import { useRef, useMemo } from "react";
import { useBoolean, useOnClickOutside } from "usehooks-ts";
import { faMap } from "@fortawesome/free-solid-svg-icons";

import ToolbarButton from "@/components/Map/SideButtons/ToolbarButton";
import { useMapStyles } from "@/components/Map/mapStyles";
import { useMapStyleKey, useSetMapStyleKey } from "@/context/MapStyle";

export default function MapStyleButton() {
  const ref = useRef<HTMLDivElement>();
  const {
    value: showMapStyles,
    toggle: toggleMapStyleMenu,
    setFalse: hideMapStyleMenu,
  } = useBoolean(false);

  useOnClickOutside(ref, hideMapStyleMenu);

  const mapStyles = useMapStyles();
  const mapStyleKey = useMapStyleKey();
  const setMapStyleKey = useSetMapStyleKey();

  const mapMenuItems = useMemo(
    () =>
      mapStyles.map(({ name, key }) => ({
        name: name,
        selected: key === mapStyleKey,
        type: "button",
        onItemClick: () => {
          setMapStyleKey(key);
        },
      })),
    [mapStyles, mapStyleKey, setMapStyleKey],
  );

  return (
    <div ref={ref} className="relative">
      <ToolbarButton
        title="Map style menu"
        onClick={toggleMapStyleMenu}
        icon={faMap}
      />
      {showMapStyles && (
        <div className="absolute right-12 bottom-0 menu">
          {mapMenuItems.map((item) => (
            <button
              key={item.name}
              className="menu-item"
              data-selected={item.selected}
              onClick={item.onItemClick}
            >
              {item.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
