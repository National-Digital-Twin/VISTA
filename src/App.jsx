import React, { useState } from "react";
import { StandardLayout } from "@telicent-io/ds";
import "../node_modules/@telicent-io/ds/dist/style.css";

import {
  Categories,
  Grid,
  InfoPanel,
  NetworkGraph,
  SponsorsLogos,
  TelicentMap,
} from "./components";
import { CytoscapeProvider, ElementsProvider } from "./context";
import config from "./config/app-config";
import { Provider as UseFetchProvider } from "use-http";

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
      <UseFetchProvider url={config.api.url}>
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
      </UseFetchProvider>
    </StandardLayout>
  );
};

export default App;
