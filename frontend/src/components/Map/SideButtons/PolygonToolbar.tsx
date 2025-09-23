import { memo } from "react";

import Box from "@mui/material/Box";
import { useTools } from "@/tools/useTools";

export interface MapToolbarProps {
  /** Additional classes to add to the top-level element */
  readonly className?: string;
}

function PolygonButtons() {
  const tools = useTools();
  const toolPolygonButtons = tools("polygon-button-order").map((tool) => {
    if (!tool.PolygonButtons) {
      return null;
    }
    const PolygonButtons = tool.PolygonButtons;
    return <PolygonButtons key={tool.TOOL_NAME} />;
  });

  return toolPolygonButtons;
}

const MToolPolygonButtons = memo(PolygonButtons);

export default function MapToolbar({ className }: MapToolbarProps) {
  return (
    <Box
      className={className}
      sx={{
        fontFamily: "body",
        display: "flex !important",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        gap: 2,
        marginLeft: 2,
        flexBasis: "20%",
      }}
    >
      <MToolPolygonButtons />
    </Box>
  );
}
