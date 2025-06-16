import Box from "@mui/material/Box";
import ToolbarButton from "@/components/Map/SideButtons/ToolbarButton";

export const TOOL_NAME = "Polygon controls";

export default function PolygonCreationButton({ onClickFunc }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "end" }}>
      <ToolbarButton
        title="Draw polygons"
        onClick={onClickFunc}
        svgSrc="icons/polygons.svg"
      />
    </Box>
  );
}
