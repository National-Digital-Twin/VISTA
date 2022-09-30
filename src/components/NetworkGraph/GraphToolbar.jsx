import { kebabCase } from "lodash";
import classNames from "classnames";
import React, { useRef, useState } from "react";

import { useOutsideAlerter } from "../../hooks";
import { ToolbarButton } from "../../lib";

const transformLayoutOptions = (item) => item.replace(/\s/g, "").toLowerCase();

const Toolbar = ({ cyRef, graphLayout, setGraphLayout }) => {
  const [expand, setExpand] = useState(false);
  const [showLayoutOptions, setShowLayoutOptions] = useState(false);

  const hangleLayoutChange = (event) => {
    setGraphLayout(transformLayoutOptions(event.target.innerHTML));
  };

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
    link.href = URL.createObjectURL(file);
    link.download = name;
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
          onClick={() => setShowLayoutOptions((show) => !show)}
          showSecodaryMenu={showLayoutOptions}
          secondaryMenu={
            <SecondaryMenu
              items={["Circle", "Random", "Breadth First", "AVSDF", "Dagre", "Cola"]}
              onClose={() => setShowLayoutOptions(false)}
              onLayoutChange={hangleLayoutChange}
              selected={graphLayout}
              show={showLayoutOptions}
            />
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

const SecondaryMenu = ({ selected, show, onClose, onLayoutChange, items }) => {
  const SCROLL_OFFSET = 100;
  const secondaryMenuRef = useRef();
  const menuContainerRef = useRef();

  useOutsideAlerter({ ref: menuContainerRef, fn: onClose });

  const scroll = (scrollOffset) => {
    secondaryMenuRef.current.scrollLeft += scrollOffset;
  };

  if (!show) return null;

  const generateMenuItems = (item) => (
    <li key={item} className="whitespace-nowrap">
      <button
        className={classNames("hover:bg-black-400 px-2 rounded-md w-full h-full", {
          "bg-black-500": transformLayoutOptions(item) === selected,
        })}
        onClick={onLayoutChange}
      >
        {item}
      </button>
    </li>
  );

  return (
    <div
      ref={menuContainerRef}
      className="absolute -top-12 ml-10 bg-black-200 px-2 py-1 rounded-md flex"
    >
      <button className="ri-arrow-left-s-line" onClick={() => scroll(-SCROLL_OFFSET)} />
      <ul
        id="secondary-menu"
        ref={secondaryMenuRef}
        className="flex gap-x-2 overflow-x-scroll hide-scrollbar scroll-smooth"
        style={{ maxWidth: "24rem" }}
      >
        {items.map(generateMenuItems)}
      </ul>
      <button className="ri-arrow-right-s-line" onClick={() => scroll(SCROLL_OFFSET)} />
    </div>
  );
};

const VerticalDivider = () => <div className="border-r border-whiteSmoke-400 h-8 self-center" />;
