import config from "config/app-config";

export const createParalogEndpoint = (path) => `${config.api.url}/${path}`;
export const createOntologyEndpoint = (path) => `${config.api.ontology}/${path}`;

export const fetchOptions = {
  headers: {
    "Content-Type": "application/json",
  },
};

export * from "./assessments";
export * from "./assets";
export * from "./flood-watch-areas";

export const fetchTypeSuperclass = async (typeUri) => {
  const queryParams = new URLSearchParams({ classUri: typeUri }).toString();
  const response = await fetch(
    createParalogEndpoint(`ontology/class?${queryParams}`),
    fetchOptions
  );
  if (!response.ok) {
    return {};
  }
  return response.json();
};

export const fetchResidentialInformation = async (personUri) => {
  const queryParams = new URLSearchParams({ personUri }).toString();
  const response = await fetch(
    createParalogEndpoint(`person/residences?${queryParams}`),
    fetchOptions
  );
  if (!response.ok) {
    throw new Error("An error occured while retrieving residential information");
  }
  return response.json();
};

export const fetchIconStyles = async (typeUri) => {
  const queryParam = new URLSearchParams({ uri: typeUri }).toString();
  const response = await fetch(createOntologyEndpoint(`styles/class?${queryParam}`), fetchOptions);

  if (!response.ok) {
    return undefined;
  }
  return response.json();
};
