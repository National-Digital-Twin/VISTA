import createStore from "@/hooks/createStore";
import { STATION_TYPES } from "@/api/hydrology";
import type { StationType } from "@/api/hydrology";

export interface HydrologyState {
  /** Hydrology station types to be shown on the map */
  selectedStationTypes: Record<StationType, boolean>;

  /** Toggle whether a particular station type is shown on the map */
  toggleSelectedStationType: (stationType: StationType) => void;
}

export default createStore<HydrologyState>("hydrology", (set) => ({
  selectedStationTypes: Object.fromEntries(
    Object.values(STATION_TYPES).map((stationType: StationType) => [
      stationType,
      false,
    ]),
  ) as Record<StationType, boolean>,
  toggleSelectedStationType(stationType) {
    set((state) => ({
      selectedStationTypes: {
        ...state.selectedStationTypes,
        [stationType]: !state.selectedStationTypes[stationType],
      },
    }));
  },
}));
