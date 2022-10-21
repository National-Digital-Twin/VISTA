import React from "react";
import { StandardLayout } from "@telicent-io/ds";
import "../node_modules/@telicent-io/ds/dist/style.css";

import { Categories, SponsorsLogos } from "./components";
import { CytoscapeProvider, ElementsProvider } from "./context";
// import config from "./config/app-config";
// import Main from "./lib/Main";
import NetworkGraph from "./components/NetworkGraph/NetworkGraph";
import TelicentMap from "./components/Map/TelicentMap";
import InfoPanel from "./components/InfoPanel/InfoPanel";

const App = () => {
  // if (config && config.api && config.api.url)

  return (
    <StandardLayout appName="paralog" beta={true}>
      <SponsorsLogos />
      <CytoscapeProvider>
        <ElementsProvider>
          <div className="relative h-full">
            <Categories />
            <InfoPanel />
            <div className="grid grid-rows-1 grid-cols-2 gap-x-2 h-full">
              <NetworkGraph />
              <TelicentMap />
            </div>
          </div>
          {/* <Main config={config}> */}
          {/* <DataFigures /> */}
          {/* <DataPresentation /> */}
          {/* </Main> */}
        </ElementsProvider>
      </CytoscapeProvider>
    </StandardLayout>
  );
};

export default App;
