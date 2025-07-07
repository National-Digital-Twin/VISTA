import "@testing-library/jest-dom";

// mockout featureFlags to avoid import.meta issues without babel transforms
jest.mock("./config/feature-flags", () => ({
  default: {
    devTools: true,
    routing: true,
    uiNext: true,
    pageHeader: false,
    feedbackWidget: false,
    environmentallySensitiveAreas: true,
    assetTable: true,
  },
}));

// mockout appConfig to avoid import.meta issues without babel transforms
jest.mock("./config/app-config", () => ({
  default: {
    map: {
      maptilerToken: "",
    },
    api: {
      url: "/vista",
    },
    services: {
      ontology: "/transparent-proxy",
      ndtpPython: "/ndtp-python/api/graphql/",
      user: "/ndtp-python/api/user/",
      signout: "/ndtp-python/api/auth/signout/",
    },
    configErrors: [],
  },
}));

// mockout URL.createObjectURL for maplibre-gl to avoid type errors
if (typeof window.URL.createObjectURL === "undefined") {
  window.URL.createObjectURL = jest.fn();
}
