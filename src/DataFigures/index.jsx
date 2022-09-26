import React, { useEffect, useContext, useCallback, useState } from "react";
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

const DataFigures = () => {
  const [selected, setSelected] = useState([]);
  const { updateElements, elements } = useContext(ElementsContext);

  const { get, loading } = useFetch(config.api.url);

  const resetAllConnectionsAndAssets = useCallback(() => {
    updateElements({
      assets: [],
      connections: [],
    });
  }, [updateElements]);

  const processAllConnectionsAndAssetResults = useCallback(
    (selectedFilters = []) => {
      if (IsEmpty(selectedFilters)) return;

      if (IsEmpty(selected)) {
        resetAllConnectionsAndAssets();
        return;
      }

     
      const { assets, connections } = buildAssetAndConnectionLinks(
        {rawAssets: selectedFilters[0], rawConnections: selectedFilters[1]}
      );

      updateElements({
        assets: Object.values(assets),
        connections: Object.values(connections),
      });
    },
    [selected, resetAllConnectionsAndAssets, updateElements]
  );
  const getDetails = useCallback (async (assetsUrl, connectionUrl) => {
    const assets = await get(assetsUrl)
    const connections = await get(connectionUrl)
    processAllConnectionsAndAssetResults([assets, connections])
  }, [processAllConnectionsAndAssetResults, get])
  useEffect(() => {
    if (IsEmpty(selected)) {
      resetAllConnectionsAndAssets();
      return;
    }
    
    const connectionUrl = `assessments/connections?${selected
      .map((item) => `assessments=${encodeURIComponent(item)}`)
      .join("&")}`;
    const assetsUrl = `assessments/assets?${selected.map(uri => `assessments=${encodeURIComponent(uri)}`).join("&")}`;
    getDetails(assetsUrl, connectionUrl)
   
  }, [
    selected,
    get,
    resetAllConnectionsAndAssets,
    getDetails,
    updateElements,
  ]);

  return (
    <div
      style={{
        width: "55%",
        height: "100%",
        padding: "16px",
        borderRight: "solid 1px gold",
      }}
    >
      <Filters selected={selected} setSelected={setSelected} />
      <Tabs style={{ height: "calc(100% - 48px)" }}>
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
            loading={loading}
          />
        </TabPanel>
        <TabPanel style={{ height: "calc(100% - 54px)" }}>
          <Network
            assets={elements.assets}
            connections={elements.connections}
          />
        </TabPanel>
      </Tabs>
    </div>
  );
};

export default DataFigures;
