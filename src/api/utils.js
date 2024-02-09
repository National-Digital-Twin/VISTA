import config from "config/app-config";

const createParalogEndpoint = (path) => `${config.api.url}/${path}`;
const createOntologyEndpoint = (path) => `${config.services.ontology}/${path}`;

const fetchOptions = {
  headers: {
    "Content-Type": "application/json",
  },
};

export { createParalogEndpoint, createOntologyEndpoint, fetchOptions };
