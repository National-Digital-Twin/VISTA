import createStore from "@/hooks/createStore";
import { SandbagPlacement } from "@/api/paralog-python";

export interface SandbagState {
  selectedPlacement: SandbagPlacement | null;
  setSelectedPlacement: (placement: SandbagPlacement | null) => void;
  mousePosition: { latitude: number; longitude: number } | null;
  setMousePosition: (
    mousePosition: { latitude: number; longitude: number } | null,
  ) => void;
}

export default createStore<SandbagState>("sandbag", (set) => ({
  selectedPlacement: null,
  setSelectedPlacement: (selectedPlacement) =>
    set({
      selectedPlacement,
    }),
  mousePosition: null,
  setMousePosition: (mousePosition) =>
    set({
      mousePosition,
    }),
}));
