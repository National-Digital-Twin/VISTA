import React, { useState } from "react";
import { StandardLayout } from "@telicent-io/ds";
import { Provider as UseHttpProvider } from "use-http";
import "../node_modules/@telicent-io/ds/dist/style.css";

import { Dataset, Grid, InfoPanel, NetworkGraph, SponsorsLogos, TelicentMap } from "./components";
import { CytoscapeProvider, ElementsProvider } from "./context";
import config from "./config/app-config";
import { ErrorNotification } from "lib";

const App = () => {
  const [showGrid, setShowGrid] = useState(false);

  const toggleView = () => {
    setShowGrid((prevShow) => !prevShow);
  };

  if (!config && !config.api && !config.api.url) {
    console.error("Missing configuration");
  }

  return (
    <UseHttpProvider url={config.api.url}>
      <StandardLayout appName="paralog" beta={true}>
        <SponsorsLogos />
        <CytoscapeProvider>
          <ElementsProvider>
            <div className="relative h-full">
              <ErrorNotification />
              <Dataset showGrid={showGrid} toggleView={toggleView} />
              <InfoPanel />
              <div className="grid grid-rows-1 grid-cols-2 gap-x-2 h-full">
                {showGrid ? <Grid /> : <NetworkGraph />}
                <TelicentMap />
              </div>
            </div>
          </ElementsProvider>
        </CytoscapeProvider>
      </StandardLayout>
    </UseHttpProvider>
  );
};

export default App;
