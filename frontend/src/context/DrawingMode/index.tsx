import MapboxDraw, {
  DrawCreateEvent,
  DrawCustomMode,
  DrawDeleteEvent,
  DrawUpdateEvent,
} from "@mapbox/mapbox-gl-draw";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useControl, useMap } from "react-map-gl/maplibre";
import type { Feature } from "geojson";
import { useShallow } from "zustand/react/shallow";
import RectangleMode from "mapbox-gl-draw-rectangle-mode";
import {
  CircleMode,
  DirectMode,
  DragCircleMode,
  SimpleSelectMode,
} from "@/vendor/mapbox-gl-draw-circle";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "./maplibre-gl-draw.css";
import useSharedStore, { State } from "@/hooks/useSharedStore";
import { drawStyles } from "./theme";

export interface DrawingModeContextProviderProps {
  children: React.ReactNode;
}

interface DrawingModeContextValue {
  draw: MapboxDraw;
  isMapLoaded: boolean;
}

const DrawingModeContext = createContext<DrawingModeContextValue | null>(null);

const modes = {
  ...MapboxDraw.modes,
  draw_rectangle: RectangleMode,
  draw_circle: CircleMode,
  drag_circle: DragCircleMode,
  direct_select: DirectMode,
  simple_select: SimpleSelectMode,
} as {
  [key in keyof typeof MapboxDraw.modes]: DrawCustomMode;
} & {
  draw_circle: DrawCustomMode;
  drag_circle: DrawCustomMode;
};

export function DrawingModeContextProvider({
  children,
}: DrawingModeContextProviderProps) {
  const { paralogMap: map } = useMap();
  const [isMapLoaded, setIsMapLoaded] = useState(map.loaded());

  const blue = "#3bb2d0";
  const orange = "#fbb03b";
  const white = "#fff";

  const draw = useControl(
    () =>
      new (MapboxDraw as any)({
        userProperties: true,
        displayControlsDefault: false,
        modes,
        styles: drawStyles,
      }),
  );

  useEffect(() => {
    const handleLoadChange = () => setIsMapLoaded(true);
    map.on("load", handleLoadChange);

    return () => {
      map.off("load", handleLoadChange);
      setIsMapLoaded(false);
    };
  }, [map]);

  const contextValue = useMemo(
    () => ({ draw, map, isMapLoaded }),
    [draw, map, isMapLoaded],
  );

  return (
    <DrawingModeContext.Provider value={contextValue}>
      {children}
    </DrawingModeContext.Provider>
  );
}

interface DrawShapeCallbacks {
  onAddFeatures: (features: Feature[]) => void;
  onUpdateFeatures: (features: Feature[]) => void;
  onDeleteFeatures: (features: NonNullable<Feature["id"]>[]) => void;
}

type UseDrawShapeOptions =
  | { drawingMode: "draw_polygon" | "draw_rectangle"; options?: never }
  | { drawingMode: "draw_circle"; options?: { initialRadiusInKm?: number } };

export const useDrawingMode = <T extends Feature>(
  selector: (
    state: Omit<
      State,
      keyof { [K in keyof State as State[K] extends Function ? K : never]: any }
    >,
  ) => T[],
  { onAddFeatures, onUpdateFeatures, onDeleteFeatures }: DrawShapeCallbacks,
) => {
  const context = useContext(DrawingModeContext);
  if (!context) {
    throw new Error(
      "useDrawingMode must be used within a DrawingModeContextProvider",
    );
  }

  const { draw, isMapLoaded } = context;
  const { paralogMap: map } = useMap();
  const features = useSharedStore(useShallow(selector));

  const startDrawing = useCallback(
    ({ drawingMode, options }: UseDrawShapeOptions) => {
      const handleDrawCreateEvent = (event: DrawCreateEvent) => {
        onAddFeatures(event.features);
        map.off("draw.create", handleDrawCreateEvent);
      };

      const handleModeChange = () => {
        map.off("draw.create", handleDrawCreateEvent);
        map.off("draw.modechange", handleModeChange);
      };

      switch (drawingMode) {
        case "draw_circle":
          draw.changeMode(drawingMode, options);
          break;
        default:
          draw.changeMode(drawingMode as "draw_polygon");
          break;
      }

      map.on("draw.create", handleDrawCreateEvent);
      map.on("draw.modechange", handleModeChange);
    },
    [draw, map, onAddFeatures],
  );

  useEffect(() => {
    const handleDrawEvent = (event: DrawUpdateEvent | DrawDeleteEvent) => {
      const relevantFeatures = event.features.filter((eventFeature) =>
        features.find((feature) => eventFeature.id === feature.id),
      );

      if (relevantFeatures.length > 0) {
        switch (event.type) {
          case "draw.update":
            onUpdateFeatures(relevantFeatures);
            break;
          case "draw.delete":
            onDeleteFeatures(relevantFeatures.map(({ id }) => id));
            break;
          default:
            console.warn("Unhandled event:", event);
        }
      }
    };

    map.on("draw.update", handleDrawEvent);
    map.on("draw.delete", handleDrawEvent);

    return () => {
      map.off("draw.update", handleDrawEvent);
      map.off("draw.delete", handleDrawEvent);
    };
  }, [features, map, onDeleteFeatures, onUpdateFeatures]);

  useEffect(() => {
    if (!isMapLoaded) return;

    features.forEach(draw.add);
    return () => {
      draw.delete(features.map(({ id }) => id as string));
    };
  }, [draw, features, isMapLoaded]);

  return { startDrawing, features };
};
