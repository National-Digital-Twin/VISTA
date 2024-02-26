import React, { useState } from "react";
import { ToolbarButton, ToolbarMenu } from "lib";
import { DRAW_CIRCLE } from "./DrawControl";
const DrawingTools = ({ DRAW_POLYGON, compact, selectedTool, onDrawPolygon, onDrawCircle }) => {
  const [showDrawingTools, setShowDrawingTools] = useState(false);

  const selectionTools = [
    {
      id: "Polygon Tool",
      children: (
        <>
          <span className="fa-solid fa-draw-polygon mr-2" />
          Polygon tool
        </>
      ),
      selected: selectedTool === DRAW_POLYGON,
      type: "button",
      onItemClick: onDrawPolygon,
    },
    {
      id: "Circle Tool",
      children: (
        <>
          <span className="fa-regular fa-circle mr-2" />
          Circle tool
        </>
      ),
      selected: selectedTool === DRAW_CIRCLE,
      type: "button",
      onItemClick: onDrawCircle,
    },
  ];

  if (compact) {
    return (
      <ToolbarButton
        icon="fg-polyline-pt"
        label="Drawing tools"
        onClick={() => setShowDrawingTools(true)}
        showSecondaryMenu={showDrawingTools}
        secondaryMenu={
          <ToolbarMenu menuItems={selectionTools} onClose={() => setShowDrawingTools(false)} />
        }
      />
    );
  }

  return (
    <>
      <ToolbarButton
        icon="fa-solid fa-draw-polygon"
        label="Polygon tool"
        selected={selectedTool === DRAW_POLYGON}
        onClick={onDrawPolygon}
      />
      <ToolbarButton
        icon="fa-regular fa-circle"
        label="Radius tool"
        selected={selectedTool === DRAW_CIRCLE}
        onClick={onDrawCircle}
      />
    </>
  );
};

export default DrawingTools;
