import { create } from "zustand";

interface MousePositionStore {
  mousePosition: { latitude: number; longitude: number } | null;
  setMousePosition: (
    mousePosition: { latitude: number; longitude: number } | null,
  ) => void;
}

export const useMousePositionStore = create<MousePositionStore>((set) => ({
  mousePosition: null,
  setMousePosition: (position) => set({ mousePosition: position }),
}));
