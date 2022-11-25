import { kebabCase } from "lodash";
import React, { useState } from "react";

import { ToolbarButton, ToolbarMenu, VerticalDivider } from "../../lib";

const LAYOUTS = ["Cola", "Circle", "Random", "Breadth First", "AVSDF", "Dagre"];
const transformLayoutOptions = (item) => item.replace(/\s/g, "").toLowerCase();

const Toolbar = ({ cyRef, graphLayout, setGraphLayout }) => {
  const [expand, setExpand] = useState(false);
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

  if (!expand) {
    return (
      <Wrapper>
        <button
          className="flex items-center gap-x-2 px-2 py-[7px] bg-black-200"
          onClick={() => setExpand(true)}
        >
          Toolbar
          <i className="ri-arrow-right-s-line flex items-center" />
        </button>
      </Wrapper>
    );
  }

  return (
    <Wrapper className="absolute bottom-0 left-0 text-whiteSmoke font-body">
      <ul className="bg-black-200 px-2 py-1 flex items-center gap-x-2">
        <li>
          <MinimiseBtn label="minimise toolbar" onMinimise={() => setExpand(false)} />
        </li>
        <VerticalDivider />
        <ToolbarButton icon="ri-file-download-line" label="Export" onClick={onExportToPNG} />
        <ToolbarButton icon="ri-focus-3-line" label="Center" onClick={onCenterClick} />
        <ToolbarButton icon="ri-aspect-ratio-line" label="Fit" onClick={onFitClick} />
        <ToolbarButton
          icon="ri-shape-fill"
          label="Layout"
          onClick={() => setShowLayoutOptions(true)}
          showSecondaryMenu={showLayoutOptions}
          secondaryMenu={
            <ToolbarMenu id="secondary-menu" menuItems={layoutMenuItems} onClose={() => setShowLayoutOptions(false)} />
          }
        />
      </ul>
    </Wrapper>
  );
};

export default Toolbar;

const Wrapper = ({ children }) => (
  <div className="absolute bottom-0 left-0 text-whiteSmoke font-body">{children}</div>
);

const MinimiseBtn = ({ label, onMinimise }) => (
  <>
    <button
      aria-labelledby={kebabCase(label)}
      className="flex items-center px-3 w-fit"
      onClick={onMinimise}
    >
      <span aria-hidden={true} role="img" className="ri-indeterminate-circle-fill !text-base" />
    </button>
    <div role="tooltip" id={kebabCase(label)}>
      {label}
    </div>
  </>
);
