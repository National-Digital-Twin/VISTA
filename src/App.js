import React from "react";
import { StandardLayout } from "@telicent-io/ds";
import "../node_modules/@telicent-io/ds/dist/style.css";

import DataPresentation from "./DataPresentation";
import DataFigures from "./DataFigures";
import AssetProvider from "./AssetContext";
import ElementsProvider from "./ElementsContext";
function App() {
  return (
    <StandardLayout appName="paralog" beta={true}>
      <ElementsProvider>
        <AssetProvider>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              width: "inherit",
              height: "100%",
            }}
          >
            <DataFigures />
            <DataPresentation />
          </div>
        </AssetProvider>
      </ElementsProvider>
    </StandardLayout>
  );
}

export default App;
