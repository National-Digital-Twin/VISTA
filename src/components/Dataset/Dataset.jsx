import React, { useState } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { kebabCase } from "lodash";
import ReactSwitch from "react-switch";

import { FloatingPanel, VerticalDivider } from "lib";
import Assessments from "./Assessments";
import FloodAreas from "components/Map/FloodAreas";

const Dataset = ({ showGrid, toggleView }) => {
  const [showPanel, setShowPanel] = useState(true);

  const togglePanel = () => {
    setShowPanel((show) => !show);
  };

  return (
    <FloatingPanel
      position="top-0"
      className="flex flex-col gap-y-2 p-2"
      style={{ maxWidth: "20rem", maxHeight: "calc(100% - 50px)" }}
    >
      {/* <Assets
        showPanel={showPanel}
        showGrid={showGrid}
        togglePanel={togglePanel}
        toggleView={toggleView}
      /> */}
      <FloodAreas />
    </FloatingPanel>
  );
};
export default Dataset;
Dataset.defaultProps = {
  showGrid: false,
  toggleView: () => {},
};
Dataset.propTypes = {
  showGrid: PropTypes.bool,
  toggleView: PropTypes.func,
};

const DatasetHeader = () => {
  return (
    <ul className="nav nav-tabs">
      <li>Dataset</li>
      <li>Flood Areas</li>
    </ul>
  );
};

const Assets = ({ showPanel, togglePanel, showGrid, toggleView }) => {
  return (
    <>
      <DBButton
        ariaHidden
        onToggle={togglePanel}
        className={classNames({ hidden: showPanel, block: !showPanel })}
      />
      <div
        className={classNames("grow min-h-0 overflow-y-auto", {
          hidden: !showPanel,
          block: showPanel,
        })}
      >
        <div className="inline-flex gap-x-2 border-b border-black-500 pb-1 w-full">
          <DBButton active onToggle={togglePanel} />
          <VerticalDivider height="h-5" />
          <h2 className="font-medium">Dataset</h2>
          <label className="flex items-center gap-x-1 text-xs w-fit ml-auto">
            Grid
            <ReactSwitch
              onChange={toggleView}
              checked={showGrid}
              offColor="#636363"
              onColor="#f5f5f5"
              onHandleColor="#141414"
              handleDiameter={10}
              height={16}
              width={32}
              uncheckedIcon={false}
              checkedIcon={false}
            />
          </label>
        </div>
        <Assessments />
      </div>
    </>
  );
};

const DBButton = ({ active, onToggle, ariaHidden, className: wrapperClassName }) => {
  const tooltip = `${active ? "Close" : "Open"} dataset panel`;
  return (
    <div
      aria-hidden={ariaHidden}
      className={classNames("relative", { [wrapperClassName]: wrapperClassName })}
    >
      <button
        aria-labelledby={kebabCase(tooltip)}
        className="flex items-center justify-center"
        onClick={onToggle}
      >
        <span
          aria-hidden
          role="img"
          className={classNames("ri-database-2-fill !text-base", {
            "text-appColor": active,
          })}
        />
      </button>
      <div id={kebabCase(tooltip)} role="tooltip">
        {tooltip}
      </div>
    </div>
  );
};
