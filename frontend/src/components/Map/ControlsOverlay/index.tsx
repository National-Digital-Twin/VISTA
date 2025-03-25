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

  const {
    value: dependantPanelOpen,
    setTrue: showConnectedAssetsPanel,
    setFalse: hideConnectedAssetsPanel,
  } = useBoolean(false);

  const shouldShowControlPanel = featureFlags.uiNext && controlPanelOpen;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        margin: 1,
      }}
    >
      <Grid2
        container
        size={12}
        sx={{
          flexGrow: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <Grid2
          size={dependantPanelOpen ? 6 : 3}
          sx={{
            padding: 1,
            height: "100%",
            minHeight: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            className="pointer-events-auto"
            style={{ height: "100%", padding: "5px", maxHeight: "100%" }}
          >
            {shouldShowControlPanel && (
              <ControlPanel
                connectedAssetsPanelOpen={dependantPanelOpen}
                hideConnectedAssets={hideConnectedAssetsPanel}
                showConnectedAssets={showConnectedAssetsPanel}
              />
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
        <Grid2 size={dependantPanelOpen ? 4 : 0}>
          <Box sx={{ marginTop: "10px", pointerEvents: "auto" }}>
            {controlPanelOpen && ( // Only show close button when the panel is open
              <MToolbar
                onOpenControlPanel={() => {
                  hideControlPanel(); // Hide Control Panel
                  hideConnectedAssetsPanel(); // Also hide Connected Assets Panel
                }}
              />
            )}
          </Box>
        </Grid2>
        <Grid2
          size={dependantPanelOpen ? 2 : 9}
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "flex-end",
            padding: "10px",
          }}
        >
          <Box
            sx={{
              marginTop: "10px",
              maxHeight: "65vh",
              pointerEvents: "auto",
            }}
          >
            <MapToolbar />
          </Box>
        </Grid2>
      </Grid2>
      <Grid2
        container
        size={12}
        sx={{
          transition: "flex-grow 0.3s ease",
          padding: 1,
        }}
      >
        <Grid2 size={12}>
          <Box sx={{ zIndex: 10000, backgroundColor: "pink" }}>
            <DetailPanels />
          </Box>
        </Grid2>
      </Grid2>
    </Box>
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
    <Box sx={{ height: "100%" }}>
      {detailPanels.map((detailPanel) => {
        const Component = detailPanel.component;
        return <Component key={detailPanel.key} />;
      })}
    </Box>
  );
}
