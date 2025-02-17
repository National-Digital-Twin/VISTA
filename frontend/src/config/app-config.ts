// Vite fills in these environment variables for us

import featureFlags from "./feature-flags";

const config = {
  map: {
    maptilerToken: import.meta.env.VITE_MAP_TILER_TOKEN
  },
  api: {
    url: import.meta.env.VITE_PARALOG_API_URL,
  },
  auth: {
    url: import.meta.env.VITE_AUTH_TEST_URL,
  },
  services: {
    ontology: import.meta.env.VITE_ONTOLOGY_SERVICE_URL,
    ndtpPython: "/ndtp-python/api/graphql/",
  },
  canny: {
    appId: import.meta.env.VITE_CANNY_APP_ID,
    boardToken: import.meta.env.VITE_CANNY_BOARD_TOKEN,
  },
  configErrors: [] as string[],
};

if (!import.meta.env.VITE_ONTOLOGY_SERVICE_URL) {
  config.configErrors.push(
    "No VITE_ONTOLOGY_SERVICE_URL is specified in .env - please check it's present. " +
      "For local dev this is probably http://localhost:3030",
  );
}

if (!import.meta.env.VITE_PARALOG_API_URL) {
  config.configErrors.push(
    "No VITE_PARALOG_API_URI is specified in .env - please check it's present. " +
      "For local dev this is probably http://localhost:4001. " +
      "Note that these environment variables now all need a VITE_ prefix (see PR #95).",
  );
}

if (!import.meta.env.VITE_MAP_TILER_TOKEN) {
  config.configErrors.push(
    "No VITE_MAP_TILER_TOKEN is specified in .env - please check it's present. " +
      "If you don't have the map tiler token, speak to one of the other devs.",
  );
}

const notify = import.meta.env.PROD ? config.configErrors.push : console.warn;

if (!import.meta.env.VITE_CANNY_APP_ID) {
  if (featureFlags.feedbackWidget) {
    notify(
      "No VITE_CANNY_APP_ID is specified in .env - please check it's present. " +
        "You can find this in the Canny dashboard settings.",
    );
  }
}

if (!import.meta.env.VITE_CANNY_BOARD_TOKEN) {
  if (featureFlags.feedbackWidget) {
    notify(
      "No VITE_CANNY_BOARD_TOKEN is specified in .env - please check it's present. " +
        "You can find this in the Canny dashboard settings.",
    );
  }
}

if (!import.meta.env.VITE_MET_OFFICE_GLOBAL_SPOT_API_KEY) {
  if (import.meta.env.VITE_GLOBAL_SPOT_MET_OFFICE_API_KEY) {
    config.configErrors.push(
      "No VITE_MET_OFFICE_GLOBAL_SPOT_API_KEY but VITE_GLOBAL_SPOT_MET_OFFICE_API_KEY is defined. " +
        "Update the name in your .env - note the order of 'global spot' and 'met office'.",
    );
  }
}

export default config;
