import { memo } from "react";
import { Box, Grid2 } from "@mui/material";
import {
  faChevronRight,
  faChevronLeft,
} from "@fortawesome/free-solid-svg-icons";
import { useBoolean } from "usehooks-ts";
import styles from "./style.module.css";
import { useTools } from "@/tools/useTools";
import ToolbarButton from "@/components/Map/SideButtons/ToolbarButton";
import featureFlags from "@/config/feature-flags";
import ControlPanel from "@/components/Map/ControlPanel";
import MapToolbar from "@/components/Map/SideButtons/MapToolbar";
interface ToolbarProps {
  readonly onOpenControlPanel?: () => void;
}

function Toolbar({ onOpenControlPanel }: ToolbarProps) {
  const tools = useTools();
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        marginTop: 1,
      }}
    >
      {onOpenControlPanel && (
        <ToolbarButton
          icon={faChevronLeft}
          onClick={onOpenControlPanel}
          title="Close control panel"
          width={75}
        />
      )}
      {tools("toolbar-order").map((tool) => {
        if (!tool.ToolbarTools) {
          return null;
        }
        const ToolbarTools = tool.ToolbarTools;
        return <ToolbarTools key={tool.TOOL_NAME} />;
      })}
    </Box>
  );
}

const MToolbar = memo(Toolbar);

/** Overlay, positioned atop the map, which contains all of our controls */
export default function ControlsOverlay() {
  const {
    value: controlPanelOpen,
    setTrue: showControlPanel,
    setFalse: hideControlPanel,
  } = useBoolean(true);

  const shouldShowControlPanel = featureFlags.uiNext && controlPanelOpen;

  return (
    <Grid2 container className={styles.controlsOverlay}>
      <Grid2 size={4} sx={{ padding: 1 }} className={styles.controlPanel}>
        {shouldShowControlPanel && <ControlPanel onClose={hideControlPanel} />}
        {!shouldShowControlPanel && (
          <ToolbarButton
            icon={faChevronRight}
            onClick={showControlPanel}
            title="Open control panel"
            width={75}
          />
        )}
      </Grid2>
      <Grid2 size={7} className={styles.controlPanel}>
        <MToolbar
          onOpenControlPanel={
            featureFlags.uiNext && controlPanelOpen && hideControlPanel
          }
        />
      </Grid2>
      <Grid2
        size={1}
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "flex-end",
          padding: "10px",
        }}
      >
        <div style={{ marginTop: "10px" }} className="pointer-events-auto">
          <MapToolbar className={styles.buttons} />
        </div>
      </Grid2>
    </Grid2>
  );
}
