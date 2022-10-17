import React, { useState } from "react";
import { StandardLayout } from "@telicent-io/ds";
import "../node_modules/@telicent-io/ds/dist/style.css";

import { Categories, DataFigures, DataPresentation, SponsorsLogos } from "./components";
import { CytoscapeProvider, ElementsProvider } from "./context";
import config from "./config/app-config";
import Main from "./lib/Main";

const App = () => {
  const [selectedCategories, setSelectedCategories] = useState([]);

  return (
    <StandardLayout appName="paralog" beta={true}>
      <SponsorsLogos />
      <CytoscapeProvider>
        <ElementsProvider>
          <Categories selected={selectedCategories} setSelected={setSelectedCategories} />
          <Main config={config}>
            <DataFigures selected={selectedCategories} />
            <DataPresentation />
          </Main>
        </ElementsProvider>
      </CytoscapeProvider>
    </StandardLayout>
  );
};

export default App;
