import React, { useEffect, useContext } from "react";
import TelicentGrid from "../Grid";
import useFetch from "use-http";
import config from "../../config/app-config";
import { Tabs, Tab, TabList, TabPanel } from "react-tabs";
import { IsEmpty } from "../../utils";
import "react-tabs/style/react-tabs.css";
import { createData } from "./utils";

import "./DataFigures.css";
import { ElementsContext } from "../../context/ElementContext";
import NetworkGraph from "../NetworkGraph/NetworkGraph";

const DataFigures = ({ selected }) => {
  const { setData } = useContext(ElementsContext);
  const { get, loading } = useFetch(config.api.url);

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
      const assets = await get(`assessments/assets?${params}`);
      const connections = await get(`assessments/connections?${params}`);
      const data = await createData(assets, connections, get);
      setData(data);
    };
    getAssessments();
  }, [get, selected, setData]);

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
        <TabPanel style={{ height: "100%" }}>
          <NetworkGraph />
        </TabPanel>
        <TabPanel style={{ height: "95%", paddingTop: "4px" }}>
          <TelicentGrid loading={loading} />
        </TabPanel>
      </Tabs>
    </div>
  );
};

export default DataFigures;
