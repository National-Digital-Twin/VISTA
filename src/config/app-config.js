const env = process.env.JEST_WORKER_ID ? process.env : window._env_;
const OFFLINE_ENABLED = env.OFFLINE_STYLES && env.OFFLINE_STYLES_BASE_URL && env.OFFLINE_STYLES_PATH
const config = {
  mb: {
    token: env.MAPBOX_TOKEN ? env.MAPBOX_TOKEN: OFFLINE_ENABLED ? "offline_enabled" : undefined,
  },
  map: {
    offline:{
        enabled: OFFLINE_ENABLED,
        styles: env.OFFLINE_STYLES ? env.OFFLINE_STYLES.split(","): undefined,
        base_url: env.OFFLINE_STYLES_BASE_URL,
        styles_path: env.OFFLINE_STYLES_PATH
    }
  },
  api: {
    url: env.API_URL,
  },
  beta: env.BETA === "true",
};

export default config;
