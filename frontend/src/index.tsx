import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { MapProvider } from "react-map-gl/maplibre";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApolloProvider } from "@apollo/client";

import apolloClient from "./api/apollo-client";
import App from "@/App";
import DevTools from "@/components/DevTools";
import "./index.css";
import featureFlags, {
  updateFeatureFlagsFromURL,
} from "@/config/feature-flags";

// ✅ Update feature flags from URL on app initialization
updateFeatureFlagsFromURL();

// ✅ Configure QueryClient with optimal defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
  },
});

// ✅ Root container reference
const container = document.getElementById("root");
if (!container) {
  throw new Error("Root container not found");
}

// ✅ Create and render root
const root = createRoot(container);
root.render(
  <StrictMode>
    <ApolloProvider client={apolloClient}>
      <QueryClientProvider client={queryClient}>
        <DevTools enabled={featureFlags.devTools}>
          <MapProvider>
            <App />
          </MapProvider>
        </DevTools>
      </QueryClientProvider>
    </ApolloProvider>
  </StrictMode>,
);
