// see https://www.metoffice.gov.uk/research/climate/maps-and-data/uk-synoptic-and-climate-stations
import config from "@/config/app-config";

const WEATHER_STATIONS = {
  Cowes: {
    latitude: "50.7623",
    longitude: "-1.2991",
  },
  "Needles Pleasure Park": {
    latitude: "50.667",
    longitude: "-1.5656",
  },
  "Newport (Isle of Wight)": {
    latitude: "50.7003",
    longitude: "-1.2902",
  },
  Shanklin: {
    latitude: "50.6341",
    longitude: "-1.1737",
  },
  "St Catherines Pt.": {
    latitude: "50.577",
    longitude: "-1.297",
  },
  "Ventnor (Beach)": {
    latitude: "50.592",
    longitude: "-1.212",
  },
};

const options = {
  method: "GET",
  headers: {
    accept: "application/json",
  },
};

export interface WeatherStation {
  id: string;
  name: string;
  latitude: string;
  longitude: string;
  data?: {
    features: Array<{
      properties: {
        timeSeries: Array<{
          time: string;
          screenTemperature: number;
        }>;
      };
    }>;
  };
}

export const fetchWeatherStation = async (
  latitude: string,
  longitude: string,
): Promise<WeatherStation> => {
  const query_url = `${config.weather.url}/sitespecific/v0/point/hourly?latitude=${latitude}&longitude=${longitude}&includeLocationName=true`;

  const response = await fetch(query_url, options);

  if (!response.ok) {
    throw new Error("An error occurred while retrieving weather station data");
  }

  const data = await response.json();
  return {
    id: data.features[0].properties.location.id,
    name: data.features[0].properties.location.name,
    latitude,
    longitude,
    data: data,
  };
};

export const fetchWeatherStations = async (): Promise<WeatherStation[]> => {
  const stationData = await Promise.all(
    Object.entries(WEATHER_STATIONS).map(async ([name, coords]) => {
      const data = await fetchWeatherStation(coords.latitude, coords.longitude);
      return {
        ...data,
        name,
      };
    }),
  );

  return stationData.sort((a, b) => a.name.localeCompare(b.name));
};
