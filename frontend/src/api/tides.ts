import fetchWithAuth from "@/auth/fetchAuth";

const TIDES_URL = "transparent-proxy/admiralty-tidal-discovery/";

export interface TideStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  measures: any[];
  RLOIid: number;
}

export interface TideEvent {
  time: string;
  height: number;
  type: "HighWater" | "LowWater";
}

export interface TideData {
  pastTides: TideEvent[];
  futureTides: TideEvent[];
}

export async function fetchTideStations(): Promise<TideStation[]> {
  const response = await fetchWithAuth(TIDES_URL + "V1/Stations", {});

  if (!response.ok) {
    throw new Error("Failed to fetch tidal stations from Admiralty API");
  }

  const data = await response.json();

  // Filter and map the stations
  return data.features
    .filter((station) => {
      const id = parseInt(station.properties.Id, 10);
      return id >= 39 && id <= 142; // IDs of IoW stations
    })
    .map((station) => ({
      id: station.properties.Id,
      name: station.properties.Name,
      latitude: station.geometry.coordinates[1],
      longitude: station.geometry.coordinates[0],
      measures: [
        {
          period: 900,
          parameter: "tide",
          "@id": `http://environment.data.gov.uk/hydrology/id/measures/${station.properties.Id}-tide`,
        },
      ],
      RLOIid: parseInt(station.properties.Id, 10),
    }));
}

export const fetchTideData = async (stationId: string): Promise<TideData> => {
  const response = await fetchWithAuth(
    TIDES_URL + "V1/Stations/" + stationId + "/TidalEvents?duration=2",
    {},
  );

  if (!response.ok) {
    throw new Error("Failed to fetch tidal stations from Admiralty API");
  }
  const data = await response.json();

  const now = new Date();
  const tideData: TideData = {
    pastTides: [],
    futureTides: [],
  };

  for (const event of data) {
    const tideEvent: TideEvent = {
      time: event.DateTime,
      height: event.Height,
      type: event.EventType as "HighWater" | "LowWater",
    };

    if (new Date(event.DateTime) < now) {
      tideData.pastTides.push(tideEvent);
    } else {
      tideData.futureTides.push(tideEvent);
    }
  }

  return tideData;
};
