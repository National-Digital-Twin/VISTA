import { memo } from "react";

import Box from "@mui/material/Box";
import { useTools } from "@/tools/useTools";
import { TOOL_NAME as MAP_SETTINGS_TOOL_NAME } from "@/tools/MapSettingsMenus";

export interface MapToolbarProps {
  /** Additional classes to add to the top-level element */
  readonly className?: string;
}

function ToolSideButtons({ onClickFunc }) {
  const tools = useTools();
  const toolSideButtons = tools("side-button-order").map((tool) => {
    if (!tool.SideButtons) {
      return null;
    }
    const SideButtons = tool.SideButtons;
    return (
      <SideButtons
        key={tool.TOOL_NAME}
        onClickFunc={
          tool.TOOL_NAME === MAP_SETTINGS_TOOL_NAME ? onClickFunc : undefined
        }
      />
    );
  });

  return <Box sx={{ height: "100%" }}>{toolSideButtons}</Box>;
}

const MToolSideButtons = memo(ToolSideButtons);

export default function MapToolbar({ onClickFunc }) {
  return (
    <Box
      sx={{
        fontFamily: "body",
        display: "flex",
        flexDirection: "column",
        alignItems: "start",
        gap: 2,
      }}
    >
      <MToolSideButtons onClickFunc={onClickFunc} />
    </Box>
  );
}
