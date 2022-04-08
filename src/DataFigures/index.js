import React, { useState, useEffect, useContext } from "react";
import Filters from "../Filters";
import TelicentGrid from "../Grid";
import Network from "../Network";
import useFetch from "use-http";
import config from "../config/app-config";
import { Tabs, Tab, TabList, TabPanel } from "react-tabs";
import 'react-tabs/style/react-tabs.css';

import "./DataFigures.css"
import { ElementsContext } from "../ElementsContext";
function getColor(value) {
  let hue = ((1 - value) * 120).toString(10);
  return `hsl(${hue},100%, 50%)`;
}
const DataFigures = () => {
  const {updateElements} = useContext(ElementsContext)
  const [selected, setSelected] = useState([]);
  const [assets, setAssets] = useState([]);
  const [connections, setConnections] = useState([]);
  const { get } = useFetch(config.api.url);
  useEffect(() => {
    console.log(selected);
    Promise.all([
      ...selected.map((uri) =>
        get(`/assessments/assets?assessments=${encodeURIComponent(uri)}`)
      ),
      ...selected.map((uri) =>
        get(`/assessments/connections?assessments=${encodeURIComponent(uri)}`)
      ),
    ]).then((values) => {
      let maxCount = 1;
      let maxScore = 1;

      const assetsObj = values
        .slice(0, selected.length)
        .flat()
        .reduce((acc, curr, idx) => {
          if (!acc[curr.uri]) {
            acc[curr.uri] = {
              category: "asset",
              gridIndex: idx + 1,
              id: curr.id,
              name: curr.name,
              uri: curr.uri,
              count: 0,
              criticality: 0,
            };
          }
          if (curr.hasOwnProperty("desc")) {
            acc[curr.uri].desc = curr.desc;
          }
          if (curr.hasOwnProperty("lat")) {
            acc[curr.uri].lat = parseFloat(curr.lat);
          }
          if (curr.hasOwnProperty("lon")) {
            acc[curr.uri].lon = parseFloat(curr.lon);
          }
          return acc;
        }, {});

      const connectionsObj = values
        .slice(selected.length, values.length)
        .flat()
        .reduce((acc, curr, idx) => {
          const asset1Obj = assetsObj[curr.asset1Uri];
          const asset2Obj = assetsObj[curr.asset2Uri];
          const criticality = parseInt(curr.criticality);
          asset1Obj.count = asset1Obj.count + 1;
          if (asset1Obj.count > maxCount) {
            maxCount = asset1Obj.count;
          }
          asset2Obj.count = asset2Obj.count + 1;
          if (asset2Obj.count > maxCount) {
            maxCount = asset2Obj.count;
          }
          asset1Obj.criticality = asset1Obj.criticality + criticality;
          if (asset1Obj.criticality > maxScore) {
            maxScore = asset1Obj.criticality;
          }
          asset2Obj.criticality = asset2Obj.criticality + criticality;
          if (asset2Obj.criticality > maxScore) {
            maxScore = asset2Obj.criticality;
          }
          const connObj = {
            category: "connection",
            uri: curr.connUri,
            source: curr.asset1Uri,
            sourceName: asset1Obj.name,
            sourceScoreColour: asset1Obj.scoreColour,
            target: curr.asset2Uri,
            targetName: asset2Obj.name,
            targetScoreColour: asset2Obj.scoreColour,
            criticality: criticality,
            label: `${asset1Obj.id}-${asset2Obj.id}`,
          };
          if (
            asset1Obj.hasOwnProperty("lat") &&
            asset1Obj.hasOwnProperty("lon")
          ) {
            connObj.sourceLat = asset1Obj.lat;
            connObj.sourceLon = asset1Obj.lon;
          }
          if (
            asset2Obj.hasOwnProperty("lat") &&
            asset2Obj.hasOwnProperty("lon")
          ) {
            connObj.targetLat = asset2Obj.lat;
            connObj.targetLon = asset2Obj.lon;
          }
          acc[curr.connUri] = connObj;

          return acc;
        }, {});
      Object.values(assetsObj).forEach((element) => {
        element.scoreColour = getColor(element.criticality / maxScore);
        element.countColour = getColor(element.count / maxCount);
      });
      setAssets(Object.values(assetsObj));
      setConnections(Object.values(connectionsObj));
      updateElements({assets:Object.values(assetsObj), connections: Object.values(connectionsObj) })
    });
  }, [selected, get, updateElements]);
  const renderCytoscape = () => <Network assets={assets} connections={connections} />
  return (
    <section
      style={{
        width: "55%",
        height: "100%",
        padding: "4px",
        borderRight: "solid 1px gold",
      }}
    >
      <Filters selected={selected} setSelected={setSelected} />
      <Tabs style={{height: "calc(100% - 24px)"}} forceRenderTabPanel={true}>
        <TabList style={{display: "flex"}}>
          <Tab className="telicent-tab" selectedClassName="telicent-tab_selected">Grid</Tab>
          <Tab className="telicent-tab" selectedClassName="telicent-tab_selected">Network</Tab>
        </TabList>
        <TabPanel style={{height: "calc(100% - 54px)"}}>
          <TelicentGrid assets={assets} connections={connections} />
        </TabPanel>
        <TabPanel style={{height: "calc(100% - 54px)"}}>
          {renderCytoscape()}
          
        </TabPanel>
      </Tabs>
    </section>
  );
};

export default DataFigures;
