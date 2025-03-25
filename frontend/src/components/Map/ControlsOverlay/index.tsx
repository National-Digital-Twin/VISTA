import { memo, useMemo } from "react";
import { Box, Grid2, Button, Tooltip } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { useBoolean } from "usehooks-ts";
import { useTools } from "@/tools/useTools";
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
        <Box sx={{ position: "absolute", top: "0" }}>
          <Tooltip title="Close layer panel">
            <Button
              onClick={onOpenControlPanel}
              aria-label="close layer panel"
              sx={{
                width: "6vh",
                height: "6vh",
                minWidth: "initial",
                maxWidth: "48px",
                maxHeight: "48px",
                backgroundColor: "#ffffff",
                color: "initial",
              }}
            >
              <ChevronLeft />
            </Button>
          </Tooltip>
        </Box>
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
    <Grid2
      container
      sx={{ height: "95vh", display: "flex", flexDirection: "column" }}
    >
      <Grid2 container size={12} sx={{ flexGrow: 1 }}>
        <Grid2 size={dependantPanelOpen ? 6 : 3} sx={{ padding: 1 }}>
          <Box sx={{ pointerEvents: "auto" }}>
            {shouldShowControlPanel && (
              <ControlPanel
                connectedAssetsPanelOpen={dependantPanelOpen}
                hideConnectedAssets={hideConnectedAssetsPanel}
                showConnectedAssets={showConnectedAssetsPanel}
              />
            )}
            {!shouldShowControlPanel && (
              <Tooltip title="Open layer panel">
                <Button
                  onClick={showControlPanel}
                  aria-label="open layer panel"
                  sx={{
                    width: "6vh",
                    height: "6vh",
                    minWidth: "initial",
                    maxWidth: "48px",
                    maxHeight: "48px",
                    backgroundColor: "#ffffff",
                    color: "initial",
                  }}
                >
                  <ChevronRight />
                </Button>
              </Tooltip>
            )}
          </Box>
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
