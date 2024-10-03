import TRAIN_STATIONS from "@/data/train-stations.json";
import createStore from "@/hooks/createStore";

export interface TrainState {
  /** Selected train station for details */
  selectedTrainStation: keyof typeof TRAIN_STATIONS | null;

  /** Set the selected train station */
  selectTrainStation: (station: any) => void;

  /** Deselect any train station */
  deselectTrainStation: () => void;
}

export default createStore<TrainState>("train", (set) => ({
  selectedTrainStation: null,
  selectTrainStation(station) {
    set({ selectedTrainStation: station });
  },
  deselectTrainStation() {
    set({ selectedTrainStation: null });
  },
}));
