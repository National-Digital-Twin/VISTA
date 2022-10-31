import React, { useContext, useEffect, useMemo, useState } from "react";
import useFetch from "use-http";
import PropTypes from "prop-types";
import classNames from "classnames";
import { kebabCase } from "lodash";
import ReactSwitch from "react-switch";

import { ElementsContext } from "context";
import config from "config/app-config";
import { ErrorNotification, FloatingPanel } from "lib";
import { IsEmpty } from "utils";
import { createData } from "./utils";
import Assessments from "./Assessments";

const Dataset = ({ showGrid, toggleView }) => {
  const { get, response, error } = useFetch(config.api.url);
  const { error: err, setData, setNotificationError } = useContext(ElementsContext);

  const [selected, setSelected] = useState([]);
  const [showPanel, setShowPanel] = useState(true);

  // const errorMsg = useMemo(() => error?.message, [error])
  console.log("error", error?.message)

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
    if (IsEmpty(selected)) {
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

    const getAssessments = async () => {
      const assets = await get(`assessment/assets?${params}`);
      console.log("assets", assets);

      if (response.ok) {
        const connections = await get(`assessments/connections?${params}`);

        if (response.ok) {
          const data = await createData(assets, connections, get);
          setData(data);
        }
      }
    };
    getAssessments();
  }, [get, response.ok, selected, setData]);

  if (error && !err) {
    setNotificationError(error.message)
  }

  return (
    <>
      {/* <ErrorNotification msg={error?.message} /> */}
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
    </>
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
