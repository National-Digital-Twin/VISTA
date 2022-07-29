import React, { useEffect, useContext, useCallback, useReducer } from "react";
import Filters from "../Filters";
import TelicentGrid from "../Grid";
import Network from "../Network";
import useFetch from "use-http";
import config from "../config/app-config";
import { Tabs, Tab, TabList, TabPanel } from "react-tabs";
import { IsEmpty } from "../utils";
import "react-tabs/style/react-tabs.css";
import { buildAssetAndConnectionLinks } from "./utils";

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

    default:
      return state;
  }
};

const DataFigures = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { updateElements } = useContext(ElementsContext);
  const { get } = useFetch(config.api.url);

  const resetAllConnectionsAndAssets = () => {
    dispatch({ type: RESET_CONNECTIONS_AND_ASSETS });
    updateElements({
      assets: [],
      connections: [],
    });
  };

  const saveResults = (assets, connections) => {
    dispatch({
      type: SET_CONNECTIONS_AND_ASSETS,
      data: {
        assets,
        connections,
      },
    });

    updateElements({
      assets,
      connections,
    });
  };

  /**
   * Generate api calls for each endpoint
   * @param {"assets"|"connections"} type "values should be assets or connections"
   * @param {Array<string>} uris
   * @returns {Array<Promise>} Array of get requests
   */
  const generateJobs = (type, uris) =>
    uris.map((uri) =>
      get(`/assessments/${type}?assessments=${encodeURIComponent(uri)}`)
    );

  const processAllConnectionsAndAssetResults = useCallback(
    (unfilteredCategories = []) => {
      if (IsEmpty(unfilteredCategories)) return;

      if (IsEmpty(state.selected)) {
        resetAllConnectionsAndAssets();
        return;
      }

      const { assets, connections } = buildAssetAndConnectionLinks(
        unfilteredCategories,
        state.selected.length
      );

      saveResults(Object.values(assets), Object.values(connections));
    },
    [state.selected, updateElements]
  );

  useEffect(() => {
    if (IsEmpty(state.selected)) {
      resetAllConnectionsAndAssets();
      return;
    }

    Promise.all([
      ...generateJobs("assets", state.selected),
      ...generateJobs("connections", state.selected),
    ]).then(processAllConnectionsAndAssetResults);
  }, [
    state.selected,
    get,
    processAllConnectionsAndAssetResults,
    updateElements,
  ]);

  const setSelected = (selected) => {
    dispatch({ type: SET_SELECTED, data: selected });
  };

  return (
    <section
      style={{
        width: "55%",
        height: "100%",
        padding: "16px",
        borderRight: "solid 1px gold",
      }}
    >
      <Filters selected={state.selected} setSelected={setSelected} />
      <Tabs style={{ height: "calc(100% - 24px)" }}>
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
          <Network assets={state.assets} connections={state.connections} />
        </TabPanel>
      </Tabs>
    </section>
  );
};

export default DataFigures;
