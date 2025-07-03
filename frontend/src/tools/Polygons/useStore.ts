import { create } from "zustand";

type DrawingMode = "drag_circle" | "draw_polygon" | null;

export interface PolygonToolbarState {
  /** Whether the polygon toolbar is currently active/visible */
  isActive: boolean;
  /** Currently active drawing mode, null if none */
  activeDrawingMode: DrawingMode;
  /** Toggle the polygon toolbar active state */
  toggle: () => void;
  /** Set the active drawing mode */
  setActiveDrawingMode: (mode: DrawingMode) => void;
}

export const usePolygonToolbarStore = create<PolygonToolbarState>((set) => ({
  isActive: false,
  activeDrawingMode: null,
  toggle: () => set((state) => ({ isActive: !state.isActive })),
  setActiveDrawingMode: (mode) => set({ activeDrawingMode: mode }),
}));
