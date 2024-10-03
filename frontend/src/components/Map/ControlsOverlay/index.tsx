import { memo } from "react";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { useBoolean } from "usehooks-ts";
import styles from "./style.module.css";
import { useTools } from "@/tools/useTools";
import ToolbarButton from "@/components/ToolbarButton";

import featureFlags from "@/config/feature-flags";

import ControlPanel from "@/components/Map/ControlPanel";
import MapToolbar from "@/components/Map/SideButtons/MapToolbar";

interface ToolbarProps {
  onOpenControlPanel?: () => void;
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
    <div className={styles.controlsOverlay}>
      {shouldShowControlPanel && (
        <ControlPanel
          className={styles.controlPanel}
          onClose={hideControlPanel}
        />
      )}
      <MapToolbar className={styles.buttons} />
      <MToolbar
        onOpenControlPanel={
          featureFlags.uiNext && !controlPanelOpen && showControlPanel
        }
      />
    </div>
  );
}
