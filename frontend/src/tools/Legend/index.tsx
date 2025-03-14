import { useBoolean, useOnClickOutside } from "usehooks-ts";
import { useRef } from "react";
import { Box } from "@mui/material";
import LegendContent from "./Content";
import styles from "./style.module.css";
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
    <div ref={ref} className="pointer-events-auto">
      {showLegend && (
        <Box className={styles.menu}>
          <LegendContent />
        </Box>
      )}
      <ToolbarButton
        title="Toggle Legend"
        onClick={toggleLegend}
        svgSrc="icons/Legend.svg"
      />
    </div>
  );
}

export const SIDE_BUTTON_ORDER = 3;
