import React from "react";
import { StandardLayout } from "@telicent-io/ds";
import "../node_modules/@telicent-io/ds/dist/style.css";

import DataPresentation from "./DataPresentation";
import DataFigures from "./DataFigures";
import AssetProvider from "./AssetContext";
import ElementsProvider from "./ElementsContext";
import config from "./config/app-config";
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
            {config.api && config.api.url ? (
              <>
                <DataFigures />
                <DataPresentation />
              </>
            ) : (
              <div className="w-full h-full flex">
                <p className="m-auto">Api url not set</p>
              </div>
            )}
          </div>
        </AssetProvider>
      </ElementsProvider>
    </StandardLayout>
  );
}

export default App;
