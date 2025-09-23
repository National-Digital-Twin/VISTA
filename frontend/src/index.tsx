import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { MapProvider } from "react-map-gl/maplibre";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApolloProvider } from "@apollo/client";
import { createTheme, ThemeProvider } from "@mui/material";
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

const baseTheme = createTheme();
const theme = createTheme({
  typography: {
    body1: {
      [baseTheme.breakpoints.up("md")]: { fontSize: "0.8rem" },
      [baseTheme.breakpoints.up("xl")]: { fontSize: "1rem" },
    },
    body2: {
      [baseTheme.breakpoints.up("md")]: { fontSize: "0.675rem" },
      [baseTheme.breakpoints.up("xl")]: { fontSize: "0.875rem" },
    },
    h5: {
      [baseTheme.breakpoints.up("md")]: { fontSize: "1.2rem" },
      [baseTheme.breakpoints.up("xl")]: { fontSize: "1.5rem" },
    },
    h6: {
      [baseTheme.breakpoints.up("md")]: { fontSize: "1rem" },
      [baseTheme.breakpoints.up("xl")]: { fontSize: "1.25rem" },
    },
    subtitle1: {
      [baseTheme.breakpoints.up("md")]: { fontSize: "0.8rem" },
      [baseTheme.breakpoints.up("xl")]: { fontSize: "1rem" },
    },
    subtitle2: {
      [baseTheme.breakpoints.up("md")]: { fontSize: "0.675rem" },
      [baseTheme.breakpoints.up("xl")]: { fontSize: "0.875rem" },
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
            <ThemeProvider theme={theme}>
              <App />
            </ThemeProvider>
          </MapProvider>
        </DevTools>
      </QueryClientProvider>
    </ApolloProvider>
  </StrictMode>,
);
