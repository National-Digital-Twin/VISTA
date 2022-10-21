import React, { useState } from "react";
import { StandardLayout } from "@telicent-io/ds";
import "../node_modules/@telicent-io/ds/dist/style.css";

import { Categories, Grid, InfoPanel, NetworkGraph, SponsorsLogos, TelicentMap } from "./components";
import { CytoscapeProvider, ElementsProvider } from "./context";
// import config from "./config/app-config";

const App = () => {
  /*   
  const isConfigValid = (config) => config && typeof config === "object" && config.api && config.api.url;
  if (!isConfigValid(config)) {
    return <ErrorHandler message="Invalid config." />;
  } */

  const [showGrid, setShowGrid] = useState(false);

  const toggleView = () => {
    setShowGrid((prevShow) => !prevShow);
  };

  return (
    <StandardLayout appName="paralog" beta={true}>
      <SponsorsLogos />
      <CytoscapeProvider>
        <ElementsProvider>
          <div className="relative h-full">
            <Categories showGrid={showGrid} toggleView={toggleView} />
            <InfoPanel />
            <div className="grid grid-rows-1 grid-cols-2 gap-x-2 h-full">
              {showGrid ? <Grid /> : <NetworkGraph />}
              <TelicentMap />
            </div>
          </div>
        </ElementsProvider>
      </CytoscapeProvider>
    </StandardLayout>
  );
};

export default App;
