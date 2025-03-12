import { createParalogEndpoint, fetchOptions } from "./utils";

export const fetchTypeSuperclass = async (typeUri: string) => {
  const queryParams = new URLSearchParams({ classUri: typeUri }).toString();
  const response = await fetch(
    createParalogEndpoint(`ontology/class?${queryParams}`),
    fetchOptions,
  );
  if (!response.ok) {
    return {};
  }
  return response.json();
};

export const fetchResidentialInformation = async (personUri: string) => {
  const queryParams = new URLSearchParams({ personUri }).toString();
  const response = await fetch(
    createParalogEndpoint(`person/residences?${queryParams}`),
    fetchOptions,
  );
  if (!response.ok) {
    throw new Error(
      "An error occured while retrieving residential information",
    );
  }
  return response.json();
};

export const fetchFloodTimeline = async (floodArea: string) => {
  const queryParam = new URLSearchParams({
    parent_uri: `http://environment.data.gov.uk/flood-monitoring/id/floodAreas/${floodArea}`,
  }).toString();
  const response = await fetch(
    createParalogEndpoint(`states?${queryParam}`),
    fetchOptions,
  );

  if (!response.ok) {
    throw new Error(
      `An error occured while retrieving flood timeline for Flood Area ${floodArea}`,
    );
  }

  return response.json();
};

export const fetchFloodMonitoringStations = async () => {
  const response = await fetch(
    "https://environment.data.gov.uk/flood-monitoring/id/stations?catchmentName=Isle%20of%20Wight",
  );

  if (!response.ok) {
    throw new Error(
      "An error occured while retrieving flood monitoring stations for the Isle of Wight",
    );
  }
  return response.json();
};
