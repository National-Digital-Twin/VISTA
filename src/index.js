import React from "react";
import ReactDOM from "react-dom";
import { MapProvider } from "react-map-gl";

import { CytoscapeProvider, ElementsProvider } from "./context";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import "./index.css";
import "./main.css";

ReactDOM.render(
  <CytoscapeProvider>
    <ElementsProvider>
      <MapProvider>
        <App />
      </MapProvider>
    </ElementsProvider>
  </CytoscapeProvider>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
