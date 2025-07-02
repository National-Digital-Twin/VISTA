import createStore from "@/hooks/createStore";

export interface PolygonToolbarState {
  /** Whether the polygon toolbar is currently active/visible */
  isActive: boolean;
  /** Toggle the polygon toolbar active state */
  toggle: () => void;
}

export const usePolygonToolbarStore = createStore<PolygonToolbarState>(
  "polygons",
  (set) => ({
    isActive: false,
    toggle: () => set((state) => ({ isActive: !state.isActive })),
  }),
);
