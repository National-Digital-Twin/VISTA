import { memo, useMemo } from "react";
import { Box, Grid2 } from "@mui/material";
import {
  faChevronRight,
  faChevronLeft,
} from "@fortawesome/free-solid-svg-icons";
import { useBoolean } from "usehooks-ts";
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
        position: "relative",
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
    <Grid2
      container
      sx={{ height: "95vh", display: "flex", flexDirection: "column" }}
    >
      <Grid2 container size={12} sx={{ flexGrow: 1 }}>
        <Grid2 size={4} sx={{ padding: 1 }}>
          <div className="pointer-events-auto">
            {shouldShowControlPanel && (
              <ControlPanel onClose={hideControlPanel} />
            )}
            {!shouldShowControlPanel && (
              <ToolbarButton
                icon={faChevronRight}
                onClick={showControlPanel}
                title="Open control panel"
                width={75}
              />
            )}
          </div>
        </Grid2>
        <Grid2 size={7}>
          <div style={{ marginTop: "10px" }} className="pointer-events-auto">
            <MToolbar
              onOpenControlPanel={
                featureFlags.uiNext && controlPanelOpen && hideControlPanel
              }
            />
          </div>
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
            <MapToolbar />
          </div>
        </Grid2>
      </Grid2>
      <Grid2 size={12} sx={{ marginTop: "auto" }}>
        <DetailPanels />
      </Grid2>
    </Grid2>
  );
}

function DetailPanels() {
  const tools = useTools();

  const detailPanels = useMemo(() => {
    const panels: {
      component: () => JSX.Element;
      key: string;
    }[] = [];

    tools("definition-order").forEach((tool) => {
      if (tool.DetailPanel) {
        panels.push({
          component: tool.DetailPanel,
          key: tool.TOOL_NAME,
        });
      }
    });

    return panels;
  }, [tools]);

  return (
    <Box sx={{ height: "100%", backgroundColor: "pink" }}>
      {detailPanels.map((detailPanel) => {
        const Component = detailPanel.component;
        return <Component key={detailPanel.key} />;
      })}
    </Box>
  );
}
