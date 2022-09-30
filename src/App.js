import React, { useState } from "react";
import { StandardLayout } from "@telicent-io/ds";
import "../node_modules/@telicent-io/ds/dist/style.css";

import { Categories, DataFigures, DataPresentation, SponsorsLogos } from "./components";
import AssetProvider from "./AssetContext";
import ElementsProvider from "./ElementsContext";
import config from "./config/app-config";
import Main from "./lib/Main";

const App = () => {
  const [selectedCategories, setSelectedCategories] = useState([]);

  return (
    <StandardLayout appName="paralog" beta={true}>
      <SponsorsLogos />
      <ElementsProvider>
        <AssetProvider>
          <Categories selected={selectedCategories} setSelected={setSelectedCategories} />
          <Main config={config}>
            <DataFigures selected={selectedCategories} />
            <DataPresentation />
          </Main>
        </AssetProvider>
      </ElementsProvider>
    </StandardLayout>
  );
};

export default App;
