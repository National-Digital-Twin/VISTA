import { createParalogEndpoint } from "./utils";

export const fetchAllFloodAreas = async () => {
  const response = await fetch(createParalogEndpoint("flood-watch-areas"));

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      data?.detail || "An error occurred while retrieving flood areas"
    );
  }
  return data;
};

export const fetchFloodAreaPolygon = async (polygonUri) => {
  const queryParam = new URLSearchParams({
    polygon_uri: polygonUri,
  }).toString();
  const response = await fetch(
    createParalogEndpoint(`flood-watch-areas/polygon?${queryParam}`)
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.detail || `An error occured while retrieving polygon ${polygonUri}`
    );
  }
  return data;
};
