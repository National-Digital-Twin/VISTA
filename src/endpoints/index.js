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

export const fetchFloodTimeline = async (floodArea) => {
  const queryParam = new URLSearchParams({
    parent_uri: `http://environment.data.gov.uk/flood-monitoring/id/floodAreas/${floodArea}`,
  }).toString();
  const response = await fetch(createParalogEndpoint(`states?${queryParam}`), fetchOptions);

  if (!response.ok) {
    throw new Error(`An error occured while retrieving flood timeline for Flood Area ${floodArea}`);
  }

  return response.json();
};

export const fetchFloodMonitoringStations = async () => {
  const response = await fetch(
    "https://environment.data.gov.uk/flood-monitoring/id/stations?catchmentName=Isle%20of%20Wight"
  );

  if (!response.ok) {
    throw new Error(
      "An error occured while retrieving flood monitoring stations for the Isle of Wight"
    );
  }
  return response.json();
};
