// Vite fills in these environment variables for us

const config = {
  api: {
    url: import.meta.env.VITE_PARALOG_API_URL || "/paralog",
  },
  services: {
    ontology: import.meta.env.VITE_ONTOLOGY_SERVICE_URL || "/transparent-proxy",
    ndtpPython: "/ndtp-python/api/graphql/",
  },
  weather: {
    url: import.meta.env.WEATHER_API_URL || "/transparent-proxy/weather"
  },
  configErrors: [] as string[],
};

if (!config.api.url) {
  config.configErrors.push(
    "No VITE_ONTOLOGY_SERVICE_URL is specified in .env - please check it's present. " +
      "For local dev this is probably http://localhost:3030",
  );
}

if (!config.services.ontology) {
  config.configErrors.push(
    "No VITE_PARALOG_API_URI is specified in .env - please check it's present. " +
      "For local dev this is probably http://localhost:4001. " +
      "Note that these environment variables now all need a VITE_ prefix (see PR #95).",
  );
}

const notify = import.meta.env.PROD
  ? config.configErrors.push.bind(config.configErrors)
  : console.warn;

export default config;
