import React, { useState } from "react";
import { StandardLayout } from "@telicent-io/ds";
import "../node_modules/@telicent-io/ds/dist/style.css";

import { Dataset, Grid, InfoPanel, NetworkGraph, SponsorsLogos, TelicentMap } from "./components";
import config from "./config/app-config";
import { ErrorNotification, ResizableContainer } from "./lib";

import "@fortawesome/fontawesome-pro/css/all.css";
import "@fortawesome/fontawesome-pro/css/sharp-solid.css"

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
        <link href="https://viglino.github.io/font-gis/css/font-gis.css" rel="stylesheet" />
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
