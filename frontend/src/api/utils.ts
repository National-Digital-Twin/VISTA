import config from "@/config/app-config";

const createParalogEndpoint = (path: string) => `${config.api.url}/${path}`;
// e.g /asset/parts
const createOntologyServiceEndpoint = (path: string) =>
  `${config.services.ontology}/${path}`;

const fetchOptions = {
  headers: {
    "Content-Type": "application/json",
  },
};

export { createParalogEndpoint, createOntologyServiceEndpoint, fetchOptions };
