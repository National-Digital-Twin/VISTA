import React, { memo, useMemo } from "react";
import { Box, Button, Tooltip } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { useBoolean } from "usehooks-ts";
import { useTools } from "@/tools/useTools";
import featureFlags from "@/config/feature-flags";
import ControlPanel from "@/components/Map/ControlPanel";
import MapToolbar from "@/components/Map/SideButtons/MapToolbar";
import PolygonToolbar from "@/components/Map/SideButtons/PolygonToolbar";
import { usePolygonToolbarStore } from "@/tools/Polygons/useStore";

interface ToolbarProps {
  readonly onOpenControlPanel?: () => void;
}

function Toolbar({ onOpenControlPanel }: ToolbarProps) {
  const tools = useTools();
  const { isActive: showPolygonToolbar } = usePolygonToolbarStore();

  return (
    <Box
      sx={{
        display: "flex",
        width: "100%",
        position: "relative",
        height: "6vh",
      }}
    >
      {onOpenControlPanel && (
        <Tooltip title="Close layer panel">
          <Button
            onClick={onOpenControlPanel}
            aria-label="close layer panel"
            disabled={showPolygonToolbar} // can't close the control panel if the polygon toolbar is open
            sx={{
              width: "6vh",
              minWidth: "initial",
              maxWidth: "48px",
              maxHeight: "48px",
              backgroundColor: "background.paper",
              color: "initial",
              margin: "0",
              flexBasis: "4%",
            }}
          >
            <ChevronLeft />
          </Button>
        </Tooltip>
      )}
      {showPolygonToolbar && <PolygonToolbar />}
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

  const { isActive: showPolygonToolbar } = usePolygonToolbarStore();

  // if the polygon drawing is active, we should show the control panel as the controls for
  // the drawing are part of the control panel and its toolbar
  const shouldShowControlPanel =
    featureFlags.uiNext && (controlPanelOpen || showPolygonToolbar);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          margin: 1,
          minHeight: 0,
          flex: "1 0",
        }}
      >
        <Box
          sx={{
            padding: 1,
            minHeight: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "row",
            paddingTop: 0,
            flex: "1 0 80%",
            gap: "10px",
          }}
        >
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
          <Box sx={{ flex: "1 1 100%", pointerEvents: "auto" }}>
            {shouldShowControlPanel && ( // Only show close button when the panel is open
              <MToolbar
                onOpenControlPanel={() => {
                  hideControlPanel(); // Hide Control Panel
                  hideConnectedAssetsPanel(); // Also hide Connected Assets Panel
                }}
              />
            )}
          </Box>
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            padding: "10px",
            paddingTop: 0,
          }}
        >
          <Box
            sx={{
              maxHeight: "65vh",
              pointerEvents: "auto",
            }}
          >
            <MapToolbar />
          </Box>
        </Box>
      </Box>
      <Box
        sx={{
          display: "flex",
          transition: "flex-grow 0.3s ease",
          padding: 1,
          minHeight: 0,
          maxHeight: "25vh",
          marginLeft: "8px",
          marginRight: "10px",
        }}
      >
        <DetailPanels />
      </Box>
    </Box>
  );
}

function DetailPanels() {
  const tools = useTools();

  const detailPanels = useMemo(() => {
    const panels: {
      component: () => React.JSX.Element;
      key: string;
    }[] = [];

    for (const tool of tools("definition-order")) {
      if (tool.DetailPanel) {
        panels.push({
          component: tool.DetailPanel,
          key: tool.TOOL_NAME,
        });
      }
    }

    return panels;
  }, [tools]);

  return (
    <>
      {detailPanels.map((detailPanel) => {
        const Component = detailPanel.component;
        return <Component key={detailPanel.key} />;
      })}
    </>
  );
}
