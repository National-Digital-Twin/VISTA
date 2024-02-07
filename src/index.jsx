import React from "react";
import { createRoot } from "react-dom/client";
import { MapProvider } from "react-map-gl";
import { Provider as UseFetchProvider } from "use-http";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import config from "./config/app-config";
import { CytoscapeProvider, ElementsProvider } from "./context";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import "./main.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: false,
      staleTime: Infinity,
    },
  },
});

const container = document.getElementById("root");
const root = createRoot(container);
root.render(
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
  </UseFetchProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
