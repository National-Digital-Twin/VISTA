import { createParalogEndpoint } from './utils';

const FLOOD_AREAS_TO_EXCLUDE = new Set(['Eastern Yar', 'Gurnard Luck', 'St Johns, Ryde']);

export const fetchAllFloodAreas = async () => {
    const response = await fetch(createParalogEndpoint('flood-watch-areas'));

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data?.detail || 'An error occurred while retrieving flood areas');
    }

    if (Array.isArray(data)) {
        return data.filter((o) => 'name' in o && !FLOOD_AREAS_TO_EXCLUDE.has(o.name));
    }

    return data;
};

export const fetchFloodAreaPolygon = async (polygonUri: string) => {
    const queryParam = new URLSearchParams({
        polygon_uri: polygonUri,
    }).toString();
    const response = await fetch(createParalogEndpoint(`flood-watch-areas/polygon?${queryParam}`));
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data?.detail || `An error occured while retrieving polygon ${polygonUri}`);
    }
    return data;
};
