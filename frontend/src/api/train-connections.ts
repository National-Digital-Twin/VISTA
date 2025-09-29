// Train Arrivals and Departures.

export const fetchTrainDepartures = async (station: string) => {
    // station uses either CRS or TIPLOC codes.
    // See http://www.railwaycodes.org.uk/

    const queryUrl = `/transparent-proxy/realtime-trains/json/search/${station}`;
    const response = await fetch(queryUrl);

    if (!response.ok) {
        throw new Error('An error occurred while retrieving train departure data for the specified station.');
    }

    return response.json();
};

export const fetchTrainArrivals = async (station: string) => {
    const queryUrl = `/transparent-proxy/realtime-trains/json/search/${station}/arrivals`;
    const response = await fetch(queryUrl);

    if (!response.ok) {
        throw new Error('An error occurred while retrieving train arrival data for the specified station.');
    }

    return response.json();
};
