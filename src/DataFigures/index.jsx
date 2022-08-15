import React, { useEffect, useContext, useCallback, useState } from "react";
import Filters from "../Filters";
import TelicentGrid from "../Grid";
import Network from "../Network";
import useFetch from "use-http";
import config from "../config/app-config";
import { Tabs, Tab, TabList, TabPanel } from "react-tabs";
import { IsEmpty } from "../utils";
import "react-tabs/style/react-tabs.css";
import { buildAssetAndConnectionLinks, generateAssetJobs } from "./utils";

import "./DataFigures.css";
import { ElementsContext } from "../ElementsContext";

const DataFigures = () => {
  const [selected, setSelected] = useState([]);
  const { updateElements, elements } = useContext(ElementsContext);

  const { get } = useFetch(config.api.url);

  const resetAllConnectionsAndAssets = useCallback(() => {
    updateElements({
      assets: [],
      connections: [],
    });
  }, [updateElements]);

  // /**
  //  * Generate api calls for each endpoint
  //  * @param {"assets"|"connections"} type "values should be assets or connections"
  //  * @param {Array<string>} uris
  //  * @returns {Array<Promise>} Array of get requests
  //  */
  // const generateJobs = useCallback(
  // (type, uris) =>
  // uris.map((uri) =>
  // get(`/assessments/${type}?assessments=${encodeURIComponent(uri)}`)
  // ),
  // [get]
  // );

  const processAllConnectionsAndAssetResults = useCallback(
    (selectedFilters = []) => {
      if (IsEmpty(selectedFilters)) return;

      if (IsEmpty(selected)) {
        resetAllConnectionsAndAssets();
        return;
      }

      const { assets, connections } = buildAssetAndConnectionLinks(
        selectedFilters,
        selected.length
      );

      updateElements({
        assets: Object.values(assets),
        connections: Object.values(connections),
      });
    },
    [selected, resetAllConnectionsAndAssets, updateElements]
  );

  useEffect(() => {
    if (IsEmpty(selected)) {
      resetAllConnectionsAndAssets();
      return;
    }

    const connectionUrl = `assessments/connections?${selected
      .map((item) => `assessments=${encodeURIComponent(item)}`)
      .join("&")}`;

    Promise.all([...generateAssetJobs(get, selected), get(connectionUrl)]).then(
      processAllConnectionsAndAssetResults
    );
  }, [
    selected,
    get,
    resetAllConnectionsAndAssets,
    processAllConnectionsAndAssetResults,
    updateElements,
  ]);

  return (
    <section
      style={{
        width: "55%",
        height: "100%",
        padding: "16px",
        borderRight: "solid 1px gold",
      }}
    >
      <Filters selected={selected} setSelected={setSelected} />
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
          <TelicentGrid
            assets={elements.assets}
            connections={elements.connections}
          />
        </TabPanel>
        <TabPanel style={{ height: "calc(100% - 54px)" }}>
          <Network
            assets={elements.assets}
            connections={elements.connections}
          />
        </TabPanel>
      </Tabs>
    </section>
  );
};

export default DataFigures;
