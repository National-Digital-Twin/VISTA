import React from "react";
import ReactDOM from "react-dom";
import { MapProvider } from "react-map-gl";
import { Provider as UseFetchProvider } from "use-http";

import config from "./config/app-config";
import { CytoscapeProvider, ElementsProvider } from "./context";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import "./main.css";

ReactDOM.render(
  <UseFetchProvider url={config.api.url}>
    <CytoscapeProvider>
      <ElementsProvider>
        <MapProvider>
          <App />
        </MapProvider>
      </ElementsProvider>
    </CytoscapeProvider>
  </UseFetchProvider>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
