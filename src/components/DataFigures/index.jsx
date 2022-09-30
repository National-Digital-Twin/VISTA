import React, { useEffect, useContext, useCallback } from "react";
import TelicentGrid from "../Grid";
import useFetch from "use-http";
import config from "../../config/app-config";
import { Tabs, Tab, TabList, TabPanel } from "react-tabs";
import { IsEmpty } from "../../utils";
import "react-tabs/style/react-tabs.css";
import { buildAssetAndConnectionLinks } from "./utils";

import "./DataFigures.css";
import { ElementsContext } from "../../ElementsContext";
import NetworkGraph from "../NetworkGraph/NetworkGraph";

const DataFigures = ({ selected }) => {
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

  useEffect(() => {
    if (IsEmpty(selected)) {
      resetAllConnectionsAndAssets();
      return;
    }

    const connectionUrl = `assessments/connections?${selected
      .map((item) => `assessments=${encodeURIComponent(item)}`)
      .join("&")}`;
    const assetsUrl = `assessments/assets?${selected.map(uri => `assessments=${encodeURIComponent(uri)}`).join("&")}`;
    Promise.all([get(assetsUrl), get(connectionUrl)]).then(
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
    <div
      style={{
        width: "55%",
        height: "100%",
        padding: "16px",
        borderRight: "solid 1px gold",
      }}
    >
      <Tabs style={{ height: "calc(100% - 48px)" }}>
        <TabList className="flex border-b border-black-700">
          <Tab className="telicent-tab" selectedClassName="telicent-tab_selected">
            Network
          </Tab>
          <Tab className="telicent-tab" selectedClassName="telicent-tab_selected">
            Grid
          </Tab>
        </TabList>
        <TabPanel style={{ height: '100%' }}>
          <NetworkGraph assets={elements.assets} connections={elements.connections} />
        </TabPanel>
        <TabPanel style={{ height: '95%', paddingTop: '4px' }}>
          <TelicentGrid
            assets={elements.assets}
            connections={elements.connections}
            loading={loading}
          />
        </TabPanel>
      </Tabs>
    </div>
  );
};

export default DataFigures;
