import { memo } from "react";
import { Grid2 } from "@mui/material";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { useBoolean } from "usehooks-ts";
import styles from "./style.module.css";
import { useTools } from "@/tools/useTools";
import ToolbarButton from "@/components/ToolbarButton";
import featureFlags from "@/config/feature-flags";
import ControlPanel from "@/components/Map/ControlPanel";
import MapToolbar from "@/components/Map/SideButtons/MapToolbar";

interface ToolbarProps {
  readonly onOpenControlPanel?: () => void;
}

function Toolbar({ onOpenControlPanel }: ToolbarProps) {
  const tools = useTools();
  return (
    <div className={styles.controlsContainer}>
      {onOpenControlPanel && (
        <ToolbarButton
          icon={faChevronRight}
          onClick={onOpenControlPanel}
          title="Open control panel"
          hideTitle
        />
      )}

      {tools("toolbar-order").map((tool) => {
        if (!tool.ToolbarTools) {
          return null;
        }
        const ToolbarTools = tool.ToolbarTools;
        return <ToolbarTools key={tool.TOOL_NAME} />;
      })}
    </div>
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
      <Grid2 size={4} sx={{ padding: "10px" }} className={styles.controlPanel}>
        {shouldShowControlPanel && (
          <ControlPanel
            className={styles.controlPanel}
            onClose={hideControlPanel}
          />
        )}
      </Grid2>
      <Grid2 size={7} sx={{}}>
        <MToolbar
          onOpenControlPanel={
            featureFlags.uiNext && !controlPanelOpen && showControlPanel
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
