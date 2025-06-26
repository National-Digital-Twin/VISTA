import { memo } from "react";

import Box from "@mui/material/Box";
import { useTools } from "@/tools/useTools";

export interface MapToolbarProps {
  /** Additional classes to add to the top-level element */
  readonly className?: string;
}

function ToolSideButtons() {
  const tools = useTools();
  const toolSideButtons = tools("side-button-order").map((tool) => {
    if (!tool.SideButtons) {
      return null;
    }
    const SideButtons = tool.SideButtons;
    return <SideButtons key={tool.TOOL_NAME} />;
  });

  return <Box sx={{ height: "100%" }}>{toolSideButtons}</Box>;
}

const MToolSideButtons = memo(ToolSideButtons);

export default function MapToolbar({ className }: MapToolbarProps) {
  return (
    <Box
      className={className}
      sx={{
        fontFamily: "body",
        display: "flex",
        flexDirection: "column",
        alignItems: "start",
        gap: 2,
      }}
    >
      <MToolSideButtons />
    </Box>
  );
}
