import createStore from "@/hooks/createStore";

export enum WEATHER_STATION_TYPES {
  Automatic = "Automatic",
  Manual = "Manual",
}

type WeatherStationType = WEATHER_STATION_TYPES;

export interface WeatherState {
  /** Weather station types to be shown on the map */
  selectedWeatherStationTypes: Record<WeatherStationType, boolean>;

  /** Toggle whether a particular station type is shown on the map */
  toggleSelectedWeatherStationType: (stationType: WeatherStationType) => void;

  /** Selected weather stations */
  selectedWeatherStations: Record<string, boolean>;

  /** Toggle whether a particular weather station is selected */
  toggleSelectedWeatherStation: (stationName: string) => void;
}

export default createStore<WeatherState>("weather", (set) => ({
  selectedWeatherStationTypes: Object.fromEntries(
    Object.values(WEATHER_STATION_TYPES).map(
      (stationType: WeatherStationType) => [stationType, false],
    ),
  ) as Record<WeatherStationType, boolean>,
  toggleSelectedWeatherStationType(stationType) {
    set((state) => ({
      selectedWeatherStationTypes: {
        ...state.selectedWeatherStationTypes,
        [stationType]: !state.selectedWeatherStationTypes[stationType],
      },
    }));
  },

  selectedWeatherStations: {},
  toggleSelectedWeatherStation(stationName) {
    set((state) => ({
      selectedWeatherStations: {
        ...state.selectedWeatherStations,
        [stationName]: !state.selectedWeatherStations[stationName],
      },
    }));
  },
}));
