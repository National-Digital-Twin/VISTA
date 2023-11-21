import config from "config/app-config";

const LOG_LEVEL = {
  DEBUG: "DEBUG",
  NONE: "NONE",
};

const measureFetch = (fetchFunction) => {
  return async (...args) => {
    const start = performance.now();
    const response = await fetchFunction(...args);
    const end = performance.now();
    const duration = end - start;
    const size = response.headers.get("content-length");
    const url = args[0];

    const data = await response.json();

    if (config.logLevel === LOG_LEVEL.DEBUG) {
      console.log(
        `Fetch to ${url} took ${duration} milliseconds and returned ${size} bytes of data`
      );
    }
    return response;
  };
};

const createParalogEndpoint = (path) => `${config.api.url}/${path}`;
const createOntologyEndpoint = (path) => `${config.api.ontology}/${path}`;

const fetchOptions = {
  headers: {
    "Content-Type": "application/json",
  },
};

export {
  measureFetch,
  createParalogEndpoint,
  createOntologyEndpoint,
  fetchOptions,
};
