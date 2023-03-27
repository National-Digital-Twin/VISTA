import React from "react";
import ReactDOM from "react-dom";
import { MapProvider } from "react-map-gl";
import { Provider as UseFetchProvider } from "use-http";
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";

import config from "./config/app-config";
import { CytoscapeProvider, ElementsProvider } from "./context";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import "./main.css";

import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

const queryClient = new QueryClient();

ReactDOM.render(
  <UseFetchProvider url={config.api.url}>
    <CytoscapeProvider>
      <ElementsProvider>
        <MapProvider>
          <QueryClientProvider client={queryClient}>
            <App />
            <ReactQueryDevtools />
          </QueryClientProvider>
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
