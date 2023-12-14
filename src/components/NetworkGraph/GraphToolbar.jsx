import React, { useState } from "react";

import { ToolbarButton, ToolbarMenu } from "../../lib";

const LAYOUTS = ["Cola", "Grid", "Random", "Breadth First", "AVSDF", "Dagre"];
const transformLayoutOptions = (item) => item.replace(/\s/g, "").toLowerCase();

const Toolbar = ({ cyRef, graphLayout, setGraphLayout }) => {
  const [showLayoutOptions, setShowLayoutOptions] = useState(false);

  const hangleLayoutChange = (event) => {
    setGraphLayout(transformLayoutOptions(event.target.innerHTML));
  };

  const layoutMenuItems = LAYOUTS.map((layout) => ({
    name: layout,
    selected: transformLayoutOptions(layout) === graphLayout,
    type: "button",
    onItemClick: hangleLayoutChange,
  }));

  const onCenterClick = () => {
    if (!cyRef.current) return;
    cyRef.current.center();
  };
  const onFitClick = () => {
    if (!cyRef.current) return;
    cyRef.current.fit();
  };

  const onExportToPNG = () => {
    if (!cyRef.current) return;
    const png = cyRef.current.png({ output: "blob" });
    const name = `telicent:graph-export${new Date().toISOString()}.png`;
    const type = "image/png";
    const link = document.createElement("a");
    const file = new Blob([png], { type: type });

    link.setAttribute("id", "downloadpng");
    link.setAttribute("href", URL.createObjectURL(file));
    link.setAttribute("download", name);
    link.click();

    URL.revokeObjectURL(link.href);
    link.remove();
  };

  return (
    <div className="toolbar bottom-0 left-0 font-body">
      <ul className="toolbar__list">
        <ToolbarButton icon="ri-file-download-line" label="Export" onClick={onExportToPNG} />
        <ToolbarButton icon="ri-focus-3-line" label="Center" onClick={onCenterClick} />
        <ToolbarButton icon="ri-aspect-ratio-line" label="Fit" onClick={onFitClick} />
        <ToolbarButton
          icon="ri-shape-fill"
          label="Layout"
          onClick={() => setShowLayoutOptions(true)}
          showSecondaryMenu={showLayoutOptions}
          secondaryMenu={
            <ToolbarMenu
              id="secondary-menu"
              menuItems={layoutMenuItems}
              onClose={() => setShowLayoutOptions(false)}
            />
          }
        />
      </ul>
    </div>
  );
};

export default Toolbar;
