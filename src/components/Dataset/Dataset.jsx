import React, { useState } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { kebabCase } from "lodash";
import ReactSwitch from "react-switch";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";

import { FloatingPanel } from "lib";
import Assessments from "./Assessments";
import FloodAreas from "components/Dataset/FloodAreas";

import "react-tabs/style/react-tabs.css";

const Dataset = ({ showGrid, toggleView }) => {
  const [showPanel, setShowPanel] = useState(true);
  const [selectedFloodAreas, setSelectedFloodAreas] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);

  const togglePanel = () => {
    setShowPanel((show) => !show);
  };

  return (
    <FloatingPanel
      position="top-0"
      className="flex flex-col gap-y-2 p-2 overflow-y-auto"
      style={{ maxWidth: "20rem", maxHeight: "calc(100% - 50px)" }}
    >
      <DatasetContent
        expand={showPanel}
        showGrid={showGrid}
        onToggle={togglePanel}
        onViewGrid={toggleView}
      >
        <Tabs>
          <TabList>
            <Tab>Assets</Tab>
            <Tab>Flood Areas</Tab>
          </TabList>

          <TabPanel>
            <Assessments selectedTypes={selectedTypes} setSelectedTypes={setSelectedTypes} />
          </TabPanel>
          <TabPanel>
            <FloodAreas
              selectedFloodAreas={selectedFloodAreas}
              setSelectedFloodAreas={setSelectedFloodAreas}
            />
          </TabPanel>
        </Tabs>
      </DatasetContent>
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

const DatasetContent = ({ expand, showGrid, onToggle, onViewGrid, children }) => {
  if (!expand) return <DBButton onToggle={onToggle} />;
  return (
    <>
      <div className="flex">
        <DBButton active onToggle={onToggle} />
        <label className="flex items-center gap-x-1 text-xs w-fit ml-auto">
          Grid
          <ReactSwitch
            onChange={onViewGrid}
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
      {children}
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
