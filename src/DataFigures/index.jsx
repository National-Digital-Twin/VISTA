import React, { useState, useEffect, useContext, useCallback } from "react";
import Filters from "../Filters";
import TelicentGrid from "../Grid";
import Network from "../Network";
import useFetch from "use-http";
import config from "../config/app-config";
import { Tabs, Tab, TabList, TabPanel } from "react-tabs";
import Asset from "./Asset";
import ConnectionAssessment from "./ConnectionAssessment";
import "react-tabs/style/react-tabs.css";

import "./DataFigures.css";
import { ElementsContext } from "../ElementsContext";

const processAssets = (acc, curr, idx) => {
  const uri = curr.uri;
  if (!acc[uri]) {
    acc[uri] = new Asset(curr, idx);
  }
  if (curr.hasOwnProperty("desc")) {
    acc[uri].setDescription(curr.desc);
  }
  if (curr.hasOwnProperty("lat")) {
    acc[uri].setLatitude(curr.lat);
  }
  if (curr.hasOwnProperty("lon")) {
    acc[uri].setLongitude(curr.lon);
  }
  return acc;
};

const processConnectionAssessments = (acc, curr) => {
  const criticality = parseInt(curr.criticality);
  const asset1 = acc.processedAssets[curr.asset1Uri];
  const asset2 = acc.processedAssets[curr.asset2Uri];
  asset1.incrementCount();
  asset2.incrementCount();
  asset1.incrementCriticalityBy(criticality);
  asset2.incrementCriticalityBy(criticality);

  if (asset1.isCountGreaterThan(acc.maxCount)) {
    acc.maxCount = asset1.getCount();
  }

  if (asset2.isCountGreaterThan(acc.maxCount)) {
    acc.maxCount = asset2.getCount();
  }

  if (asset1.isCriticalityGreaterThan(acc.maxScore)) {
    acc.maxScore = asset1.getCriticality();
  }

  if (asset2.isCriticalityGreaterThan(acc.maxScore)) {
    acc.maxScore = asset2.getCriticality();
  }

  const connectionAssessment = new ConnectionAssessment(
    curr,
    asset1,
    asset2,
    criticality
  );

  acc.reports[curr.connUri] = connectionAssessment;

  return acc;
};

const generateColours = (asset, { maxScore, maxCount }) => {
  asset.calculateScoreColour(maxScore);
  asset.calculateCountColour(maxCount);
};

const DataFigures = () => {
  const { updateElements } = useContext(ElementsContext);
  const [selected, setSelected] = useState([]);
  const [assets, setAssets] = useState([]);
  const [connections, setConnections] = useState([]);
  const { get } = useFetch(config.api.url);

  const processAssessmentCategories = useCallback(
    (assessmentsAllCategories = []) => {
      if (selected.length < 1) {
        setAssets([]);
        setConnections([]);
        updateElements({
          assets: [],
          connections: [],
        });
      }
      if (assessmentsAllCategories.length < 1) return;

      const processedAssets = assessmentsAllCategories
        .slice(0, selected.length)
        .flat()
        .reduce(processAssets, {});

      const connectionAssessments = assessmentsAllCategories
        .slice(selected.length, assessmentsAllCategories.length)
        .flat()
        .reduce(processConnectionAssessments, {
          processedAssets,
          maxCount: 1,
          maxScore: 1,
          reports: {},
        });

      Object.values(processedAssets).forEach((asset) => {
        const { maxScore, maxCount } = connectionAssessments;
        generateColours(asset, { maxScore, maxCount });
      });

      setAssets(Object.values(processedAssets));
      setConnections(Object.values(connectionAssessments.reports));

      updateElements({
        assets: Object.values(processedAssets),
        connections: Object.values(connectionAssessments.reports),
      });
    },
    [selected, updateElements]
  );

  useEffect(() => {
    if (selected.length < 1) {
      setAssets([]);
      setConnections([]);

      updateElements({
        assets: [],
        connections: [],
      });
    }

    Promise.all([
      ...selected.map((uri) =>
        get(`/assessments/assets?assessments=${encodeURIComponent(uri)}`)
      ),
      ...selected.map((uri) =>
        get(`/assessments/connections?assessments=${encodeURIComponent(uri)}`)
      ),
    ]).then(processAssessmentCategories);
  }, [selected, get, processAssessmentCategories, updateElements]);

  const renderCytoscape = () => {
    return <Network assets={assets} connections={connections} />;
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
      <Filters selected={selected} setSelected={setSelected} />
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
          <TelicentGrid assets={assets} connections={connections} />
        </TabPanel>
        <TabPanel style={{ height: "calc(100% - 54px)" }}>
          {renderCytoscape()}
        </TabPanel>
      </Tabs>
    </section>
  );
};

export default DataFigures;
