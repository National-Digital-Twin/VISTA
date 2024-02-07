import React, { useState } from "react";
import { TeliStandardLayout } from "@telicent-io/ds";

import { Dataset, Grid, InfoPanel, NetworkGraph, SponsorsLogos, TelicentMap } from "./components";
import FloodZoneTimeline from "components/Map/FloodZoneTimeline";
import config from "./config/app-config";
import { ErrorNotification, ResizableContainer } from "./lib";

import "@telicent-io/ds/dist/fontawesome.css";
import "@telicent-io/ds/dist/style.css";

const App = () => {
  const [showGrid, setShowGrid] = useState(false);

  const toggleView = () => {
    setShowGrid((prevShow) => !prevShow);
  };

  if (!config && !config.api && !config.api.url) {
    console.error("Missing configuration");
  }

  return (
    <>
      <SponsorsLogos />
      <TeliStandardLayout appName="paralog" beta={true}>
        <div className="relative h-full">
          <ErrorNotification />
          <Dataset showGrid={showGrid} toggleView={toggleView} />
          <InfoPanel />
          <div className="flex h-full gap-x-2">
            <ResizableContainer>
              <Grid showGrid={showGrid} />
              <NetworkGraph showGrid={showGrid} />
              <FloodZoneTimeline />
            </ResizableContainer>
            <TelicentMap />
          </div>
        </div>
      </TeliStandardLayout>
    </>
  );
};

export default App;
