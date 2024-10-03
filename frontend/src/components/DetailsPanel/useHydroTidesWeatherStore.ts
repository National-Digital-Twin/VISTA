import createStore from "@/hooks/createStore";
import { TideStation } from "@/api/tides";
import { HydrologyStation } from "@/api/hydrology";
import { WeatherStation } from "@/api/weather";

export type SelectedStation = {
  type: "weather" | "tides" | "hydrology";
  data: WeatherStation | TideStation | HydrologyStation;
} | null;

export interface GlobalState {
  selectedStation: SelectedStation;
  selectStation: (station: SelectedStation) => void;
  deselectStation: () => void;
}

export default createStore<GlobalState>("global", (set) => ({
  selectedStation: null,
  selectStation(station) {
    set({ selectedStation: station });
  },
  deselectStation() {
    set({ selectedStation: null });
  },
}));
