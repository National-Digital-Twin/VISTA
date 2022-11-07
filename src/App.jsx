import React, { useState } from "react";
import { StandardLayout } from "@telicent-io/ds";
import "../node_modules/@telicent-io/ds/dist/style.css";

import { Dataset, Grid, InfoPanel, NetworkGraph, SponsorsLogos, TelicentMap } from "./components";
import config from "./config/app-config";
import { ErrorNotification, ResizableContainer } from "./lib";

const App = () => {
  const [showGrid, setShowGrid] = useState(false);

  const toggleView = () => {
    setShowGrid((prevShow) => !prevShow);
  };

  if (!config && !config.api && !config.api.url) {
    console.error("Missing configuration");
  }

  return (
    <StandardLayout appName="paralog" beta={true}>
      <SponsorsLogos />
      <div className="relative h-full">
        <ErrorNotification />
        <Dataset showGrid={showGrid} toggleView={toggleView} />
        <InfoPanel />
        <div className="flex gap-x-2 h-full">
          <ResizableContainer>{showGrid ? <Grid /> : <NetworkGraph />}</ResizableContainer>
          <TelicentMap />
        </div>
      </div>
    </StandardLayout>
  );
};

export default App;
