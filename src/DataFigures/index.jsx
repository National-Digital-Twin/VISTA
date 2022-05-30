import React, { useEffect, useContext, useCallback, useReducer } from "react";
import Filters from "../Filters";
import TelicentGrid from "../Grid";
import Network from "../Network";
import useFetch from "use-http";
import config from "../config/app-config";
import { Tabs, Tab, TabList, TabPanel } from "react-tabs";
import * as R from "ramda";
import "react-tabs/style/react-tabs.css";
import {
  isEmptyArray,
  generateConnectionAssessments,
  processAssets,
} from "./utils";

import "./DataFigures.css";
import { ElementsContext } from "../ElementsContext";

const RESET_CONNECTIONS_AND_ASSETS = "RESET_CONNECTIONS_AND_ASSETS";
const SET_CONNECTIONS_AND_ASSETS = "SET_CONNECTIONS_AND_ASSETS";
const SET_SELECTED = "SET_SELECTED";
const initialState = {
  selected: [],
  assets: [],
  connections: [],
};

const reducer = (state, action) => {
  switch (action.type) {
    case RESET_CONNECTIONS_AND_ASSETS:
      return {
        ...state,
        assets: [],
        connections: [],
      };
    case SET_CONNECTIONS_AND_ASSETS:
      return {
        ...state,
        assets: action.data.assets,
        connections: action.data.connections,
      };
    case SET_SELECTED:
      return {
        ...state,
        selected: action.data,
      };
  }
};

const DataFigures = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { updateElements } = useContext(ElementsContext);
  const { get } = useFetch(config.api.url);

  const processAssessmentCategories = useCallback(
    (assessmentsAllCategories = []) => {
      if (isEmptyArray(state.selected)) {
        dispatch({ type: RESET_CONNECTIONS_AND_ASSETS });
        updateElements({
          assets: [],
          connections: [],
        });
      }

      if (isEmptyArray(assessmentsAllCategories)) return;

      const processedAssets = processAssets(
        assessmentsAllCategories,
        state.selected.length
      );

      const connectionAssessments = generateConnectionAssessments(
        assessmentsAllCategories,
        processedAssets,
        state.selected.length
      );

      const { maxScore, maxCount } = connectionAssessments;
      Object.values(processedAssets).forEach((asset) => {
        asset.calculateScoreColour(maxScore);
        asset.calculateCountColour(maxCount);
      });

      Object.values(connectionAssessments.reports).forEach((connection) => {
        connection.calculateScoreColour(maxScore);
      });

      dispatch({
        type: SET_CONNECTIONS_AND_ASSETS,
        data: {
          assets: Object.values(processedAssets),
          connections: Object.values(connectionAssessments.reports),
        },
      });

      updateElements({
        assets: Object.values(processedAssets),
        connections: Object.values(connectionAssessments.reports),
      });
    },
    [state.selected, updateElements]
  );

  useEffect(() => {
    if (isEmptyArray(state.selected)) {
      dispatch({ type: RESET_CONNECTIONS_AND_ASSETS });

      updateElements({
        assets: [],
        connections: [],
      });
    }

    Promise.all([
      ...state.selected.map((uri) =>
        get(`/assessments/assets?assessments=${encodeURIComponent(uri)}`)
      ),
      ...state.selected.map((uri) =>
        get(`/assessments/connections?assessments=${encodeURIComponent(uri)}`)
      ),
    ]).then(processAssessmentCategories);
  }, [state.selected, get, processAssessmentCategories, updateElements]);

  const renderCytoscape = () => {
    return <Network assets={state.assets} connections={state.connections} />;
  };

  const setSelected = (selected) => {
    dispatch({ type: SET_SELECTED, data: selected });
  };

  return (
    <section
      style={{
        width: "55%",
        height: "100%",
        padding: "4px",
        borderRight: "solid 1px gold",
      }}
    >
      <Filters selected={state.selected} setSelected={setSelected} />
      <Tabs style={{ height: "calc(100% - 24px)" }} forceRenderTabPanel={true}>
        <TabList style={{ display: "flex" }}>
          <Tab
            className="telicent-tab"
            selectedClassName="telicent-tab_selected"
          >
            Grid
          </Tab>
          <Tab
            className="telicent-tab"
            selectedClassName="telicent-tab_selected"
          >
            Network
          </Tab>
        </TabList>
        <TabPanel style={{ height: "calc(100% - 54px)" }}>
          <TelicentGrid assets={state.assets} connections={state.connections} />
        </TabPanel>
        <TabPanel style={{ height: "calc(100% - 54px)" }}>
          {renderCytoscape()}
        </TabPanel>
      </Tabs>
    </section>
  );
};

export default DataFigures;
