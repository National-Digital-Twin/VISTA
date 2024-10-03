import { createRoot } from "react-dom/client";
import { MapProvider } from "react-map-gl";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApolloProvider } from "@apollo/client";

import apolloClient from "./api/apollo-client";
import App from "@/App";
import DevTools from "@/components/DevTools";
import "./index.css";
import featureFlags, {
  updateFeatureFlagsFromURL,
} from "@/config/feature-flags";

// Update feature flags on initial load
updateFeatureFlagsFromURL();

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
  <ApolloProvider client={apolloClient}>
    <QueryClientProvider client={queryClient}>
      <DevTools enabled={featureFlags.devTools}>
        <MapProvider>
          <App />
        </MapProvider>
      </DevTools>
    </QueryClientProvider>
  </ApolloProvider>,
);
