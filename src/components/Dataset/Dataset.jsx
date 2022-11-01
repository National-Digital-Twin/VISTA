import React, { useContext, useEffect, useState } from "react";
import useFetch from "use-http";
import PropTypes from "prop-types";
import classNames from "classnames";
import { isEmpty, kebabCase } from "lodash";
import ReactSwitch from "react-switch";

import { ElementsContext } from "context";
import config from "config/app-config";
import { FloatingPanel } from "lib";
import { createData } from "./utils";
import Assessments from "./Assessments";

const Dataset = ({ showGrid, toggleView }) => {
  const { get, response, error } = useFetch(config.api.url);
  const { setData, displayErrorNofitication } = useContext(ElementsContext);

  const [assets, setAssets] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selected, setSelected] = useState([]);
  const [showPanel, setShowPanel] = useState(true);

  const togglePanel = () => {
    setShowPanel((show) => !show);
  };

  const handleAssessmentsChange = (event) => {
    const {
      target: { value },
    } = event;
    setSelected(
      selected.some((filter) => filter === value)
        ? selected.filter((filter) => filter !== value)
        : [...selected, value]
    );
  };

  useEffect(() => {
    if (error) {
      displayErrorNofitication("Failed to resolve the data");
      return;
    }
    displayErrorNofitication(undefined);
  }, [error, displayErrorNofitication]);

  useEffect(() => {
    if (isEmpty(selected)) {
      setData({
        assetCriticalityColorScale: {},
        assets: [],
        connections: [],
        cxnCriticalityColorScale: {},
        maxAssetCriticality: 0,
        maxAssetTotalCxns: 0,
        totalCxnsColorScale: {},
      });
      return;
    }

    const paramsArray = selected.map((item) => ["assessments", item]);
    const params = new URLSearchParams(paramsArray).toString();

    const getAssetssments = async () => {
      const assets = await get(`assessments/assets?${params}`);
      if (response.ok) {
        setAssets(assets);
        getConnections();
      }
    };

    const getConnections = async () => {
      const connections = await get(`assessments/connections?${params}`);
      if (response.ok) setConnections(connections);
    };

    getAssetssments();
  }, [get, response, selected, setData]);

  useEffect(() => {
    const getAssessments = async () => {
      const data = await createData(assets, connections, get, response);
      setData(data);
    };

    if (!isEmpty(assets) && !isEmpty(connections)) getAssessments();
  }, [assets, connections, response, get, setData]);

  return (
    <FloatingPanel
      collapsedComponent={<DBButton onToggle={togglePanel} />}
      show={showPanel}
      position="top-0"
      className="flex flex-col gap-y-2 p-2 w-52"
    >
      <div className="inline-flex gap-x-2 border-b border-black-500 pb-1">
        <DBButton active onToggle={togglePanel} />
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
      <Assessments selected={selected} onChange={handleAssessmentsChange} />
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

const DBButton = ({ active, onToggle }) => {
  const tooltip = `${active ? "Close" : "Open"} dataset panel`;
  return (
    <div className="relative">
      <button
        aria-labelledby={kebabCase(tooltip)}
        className="flex items-center justify-center"
        onClick={onToggle}
      >
        <span
          aria-hidden
          role="img"
          className={classNames("ri-database-2-fill !text-base", {
            "text-[color:var(--app-Colour)]": active,
          })}
        />
      </button>
      <div id={kebabCase(tooltip)} role="tooltip">
        {tooltip}
      </div>
    </div>
  );
};
