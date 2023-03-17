import { createParalogEndpoint } from "endpoints";

export const fetchAllFloodAreas = async () => {
  const response = await fetch(createParalogEndpoint("flood-watch-areas"));

  if (!response.ok) {
    const data = response.json();
    throw new Error(data.detail);
  }
  return response.json();
};

export const fetchFloodAreaPolygon = async (polygonUri) => {
  const queryParam = new URLSearchParams({ polygon_uri: polygonUri });
  const response = await fetch(createParalogEndpoint(`flood-watch-areas/polygon?${queryParam}`));

  if (!response.ok) {
    const data = response.json();
    throw new Error(data.detail);
  }
  return response.json();
};
