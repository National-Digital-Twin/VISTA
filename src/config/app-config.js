const env = window._env_;

const OFFLINE_ENABLED =
  env?.OFFLINE_STYLES && env?.OFFLINE_STYLES_BASE_URL && env?.OFFLINE_STYLES_PATH;

const OFFLINE_MODE = OFFLINE_ENABLED ?? false;

const config = {
  map: {
    maptilerToken: env?.MAP_TILER_TOKEN && !OFFLINE_MODE ? env.MAP_TILER_TOKEN : "offline_enabled",
    offline: {
      enabled: OFFLINE_MODE,
      styles: OFFLINE_MODE ? env?.OFFLINE_STYLES.split(",") : undefined,
      base_url: env?.OFFLINE_STYLES_BASE_URL,
      styles_path: env?.OFFLINE_STYLES_PATH,
    },
  },
  api: {
    url: env?.PARALOG_API_URL,
  },
  beta: env?.BETA ? Boolean(env.BETA) : false,
  services: {
    ontology: env?.ONTOLOGY_SERVICE_URL,
  },
};

export default config;
