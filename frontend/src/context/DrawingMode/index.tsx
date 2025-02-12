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
import { useControl, useMap } from "react-map-gl";
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

export interface DrawingModeContextProviderProps {
  /** Children */
  readonly children: React.ReactNode;
}

interface DrawingModeContextValue {
  /** The draw instance */
  readonly draw: MapboxDraw;
  readonly isMapLoaded: boolean;
}

const DrawingModeContext = createContext<DrawingModeContextValue | null>(null);

const modes = {
  ...MapboxDraw.modes,
  draw_rectangle: RectangleMode,
  /**
   * Passing draw_circle mode to enable appears to break initial radius
   */
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

  const draw = useControl(
    () =>
      new MapboxDraw({
        userProperties: true,
        displayControlsDefault: false,
        modes,
      }),
  );

  useEffect(() => {
    const handleLoadChange = () => {
      setIsMapLoaded(true);
    };

    map.on("load", handleLoadChange);

    return () => {
      map.off("load", handleLoadChange);
      setIsMapLoaded(false);
    };
  }, [map]);

  const contextValue: DrawingModeContextValue = useMemo(
    () => ({
      draw,
      map,
      isMapLoaded,
    }),
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
  | {
      drawingMode: "draw_polygon" | "draw_rectangle";
      options?: never;
    }
  | {
      drawingMode: "draw_circle";
      options?: {
        /**
         * @default 2
         */
        initialRadiusInKm?: number;
      };
    };

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

      if (drawingMode === "draw_circle") {
        draw.changeMode(drawingMode, options);
      } else {
        draw.changeMode(drawingMode as "draw_polygon");
      }

      map.on("draw.create", handleDrawCreateEvent);
      map.on("draw.modechange", handleModeChange);
    },
    [draw, map, onAddFeatures],
  );

  useEffect(() => {
    const getRelevantFeatures = (event: DrawUpdateEvent | DrawDeleteEvent) =>
      event.features.filter((eventFeature) =>
        features.some((feature) => eventFeature.id === feature.id)
      );

    const handleDrawEvent = (event: DrawUpdateEvent | DrawDeleteEvent) => {
      const relevantFeatures = getRelevantFeatures(event);
      if (relevantFeatures.length === 0) return;

      processDrawEvent(event, relevantFeatures);
    };

    const processDrawEvent = (event: DrawUpdateEvent | DrawDeleteEvent, relevantFeatures: any[]) => {
      if (event.type === "draw.update") {
        onUpdateFeatures(relevantFeatures);
      } else if (event.type === "draw.delete") {
        onDeleteFeatures(relevantFeatures.map(({ id }) => id));
      } else {
        console.warn("Unhandled event:", event);
      }
    };

    map.on("draw.update", handleDrawEvent);
    map.on("draw.delete", handleDrawEvent);

    return () => {
      map.off("draw.update", handleDrawEvent);
      map.off("draw.delete", handleDrawEvent);
    };
  }, [features, map, onDeleteFeatures, onUpdateFeatures]);
  res, map, onDeleteFeatures, onUpdateFeatures]);

  useEffect(
    function redraw() {
      if (!isMapLoaded) {
        return;
      }

      features.forEach(draw.add);

      return () => {
        draw.delete(features.map(({ id }) => id as string));
      };
    },
    [draw, features, isMapLoaded],
  );

  return { startDrawing, features };
};
