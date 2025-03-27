import { distance } from "@turf/turf";

const BASE_URL = "https://environment.data.gov.uk/hydrology/id";

export enum STATION_TYPES {
  GroundwaterDippedOnly = "GroundwaterDippedOnly",
  Groundwater = "Groundwater",
  RainfallStation = "RainfallStation",
  RiverFlow = "RiverFlow",
  RiverLevel = "RiverLevel",
}

export type StationType = STATION_TYPES;

const STATION_TYPES_MAP = {
  "https://environment.data.gov.uk/flood-monitoring/def/core/GroundwaterDippedOnly":
    STATION_TYPES.GroundwaterDippedOnly,
  "https://environment.data.gov.uk/flood-monitoring/def/core/Groundwater":
    STATION_TYPES.Groundwater,
  "https://environment.data.gov.uk/flood-monitoring/def/core/RainfallStation":
    STATION_TYPES.RainfallStation,
  "https://environment.data.gov.uk/flood-monitoring/def/core/RiverFlow":
    STATION_TYPES.RiverFlow,
  "https://environment.data.gov.uk/flood-monitoring/def/core/RiverLevel":
    STATION_TYPES.RiverLevel,
};

export interface HydrologyMeasure {
  /** Measure period */
  period: number;
  /** Parameter being measured */
  parameter: string;
  /** ID (URL) of the measure */
  ["@id"]: string;
}

export interface HydrologyStation {
  /** Station GUID */
  id: string;
  /** Station human-readable name */
  name: string;
  /** Decimal latitude */
  latitude: number;
  /** Decimal longitude */
  longitude: number;
  /** Station type(s) */
  types: StationType[];
  /** Measures */
  measures: HydrologyMeasure[];
  /** RLOI ID per Defra */
  RLOIid: number;
}

export async function fetchStations() {
  const [latitude, longitude] = [50.7, -1.35];
  const dist = 10;
  const response = await fetch(
    `${BASE_URL}/stations?status=statusActive&lat=${latitude}&long=${longitude}&dist=${dist}&_limit=20000&&_projection=RLOIid&_withView`,
  );
  const payload = await response.json();
  const hydrologyItems: HydrologyStation[] = payload.items.map((item) => ({
    id: item.stationGuid,
    name: item.label,
    latitude: item.lat,
    longitude: item.long,
    types: item.type.map((itemType) => STATION_TYPES_MAP[itemType["@id"]]),
    measures: item.measures,
    RLOIid: item.RLOIid,
  }));

  return hydrologyItems;
}

export const fetchReadings = async (
  measureUrl: string,
  startDate: Date,
  endDate: Date,
) => {
  const url = `${measureUrl}/readings?maxeq-dateTime=${endDate.toISOString()}&mineq-dateTime=${startDate.toISOString()}`;
  const response = await fetch(url);
  return await response.json();
};

export const fetchMostRecentReading = async (measureUrl: string) => {
  const url = `${measureUrl}/readings?latest`;
  const response: Response = await fetch(url);
  return await response.json();
};

export const fetchStationGeoJson = async () => {
  const response = await fetch(
    "https://check-for-flooding.service.gov.uk/api/stations.geojson",
  );

  if (!response.ok) {
    throw new Error("An error occurred while retrieving station geojson");
  }
  return response.json();
};

// Updated helper function to calculate distance between two points
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const from = [lon1, lat1];
  const to = [lon2, lat2];
  return distance(from, to, { units: "kilometers" });
}

export const fetchAllLiveStations = async () => {
  const [latitude, longitude] = [50.7, -1.35];
  const maxDistance = 19; // 19km, max radius of IoW

  const response = await fetch(
    "https://check-for-flooding.service.gov.uk/api/stations.geojson",
  );

  if (!response.ok) {
    throw new Error("An error occurred while retrieving station geojson");
  }

  const data = await response.json();

  // Filter features based on distance
  data.features = data.features.filter((feature: any) => {
    const [featureLon, featureLat] = feature.geometry.coordinates;
    const distance = calculateDistance(
      latitude,
      longitude,
      featureLat,
      featureLon,
    );
    return distance <= maxDistance;
  });

  return data;
};
