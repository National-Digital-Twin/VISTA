import React from "react";
import { StandardLayout } from "@telicent-io/ds";
import "../node_modules/@telicent-io/ds/dist/style.css";

import { DataFigures, DataPresentation, SponsorsLogos } from "./components";
import AssetProvider from "./AssetContext";
import ElementsProvider from "./ElementsContext";
import config from "./config/app-config";
import Main from "./lib/Main";

const App = () => (
  <StandardLayout appName="paralog" beta={true}>
    <SponsorsLogos />
    <ElementsProvider>
      <AssetProvider>
        <Main config={config}>
          <DataFigures />
          <DataPresentation />
        </Main>
      </AssetProvider>
    </ElementsProvider>
  </StandardLayout>
);

export default App;
