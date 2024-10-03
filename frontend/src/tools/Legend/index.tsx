import { faList } from "@fortawesome/free-solid-svg-icons";
import { useBoolean, useOnClickOutside } from "usehooks-ts";
import { useRef } from "react";
import LegendContent from "./Content";
import ToolbarButton from "@/components/Map/SideButtons/ToolbarButton";

export const TOOL_NAME = "Legend";

export function SideButtons() {
  const {
    value: showLegend,
    toggle: toggleLegend,
    setFalse: hideLegend,
  } = useBoolean(false);
  const ref = useRef<HTMLDivElement>(null);

  useOnClickOutside(ref, hideLegend);

  return (
    <div ref={ref} className="relative">
      <ToolbarButton
        title="Toggle Legend"
        onClick={toggleLegend}
        icon={faList}
      />
      {showLegend && (
        <div className="absolute right-12 bottom-0 menu">
          <LegendContent />
        </div>
      )}
    </div>
  );
}

export const SIDE_BUTTON_ORDER = 1; // Adjust this value as needed
