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
import { area as turf_area, center as turf_center } from "@turf/turf";
import { Popup } from "maplibre-gl";

import { drawStyles } from "./theme";
import { useTooltips } from "./TooltipContext";

import {
  CircleMode,
  DirectMode,
  DragCircleMode,
  SimpleSelectMode,
} from "@/vendor/mapbox-gl-draw-circle";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "./maplibre-gl-draw.css";
import "./maplibre-gl-map.css";
import useSharedStore, { State } from "@/hooks/useSharedStore";

/** Context for Drawing Mode */
interface DrawingModeContextValue {
  readonly draw: MapboxDraw;
  readonly isMapLoaded: boolean;
}
const DrawingModeContext = createContext<DrawingModeContextValue | null>(null);

/** Mapbox Draw Modes */
const modes = {
  ...MapboxDraw.modes,
  draw_rectangle: RectangleMode,
  draw_circle: CircleMode,
  drag_circle: DragCircleMode,
  direct_select: DirectMode,
  simple_select: SimpleSelectMode,
} as Record<string, DrawCustomMode>;

/** Drawing Mode Context Provider */
export function DrawingModeContextProvider({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const { paralogMap: map } = useMap();
  const [isMapLoaded, setIsMapLoaded] = useState(map.loaded());

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
    () => ({ draw, isMapLoaded }),
    [draw, isMapLoaded],
  );

  return (
    <DrawingModeContext.Provider value={contextValue}>
      {children}
    </DrawingModeContext.Provider>
  );
}

/** Callback Types */
interface DrawShapeCallbacks {
  onAddFeatures: (features: Feature[]) => void;
  onUpdateFeatures: (features: Feature[]) => void;
  onDeleteFeatures: (features: NonNullable<Feature["id"]>[]) => void;
}

type UseDrawShapeOptions =
  | {
      drawingMode: "draw_polygon" | "draw_rectangle" | "drag_circle";
      options?: never;
    }
  | { drawingMode: "draw_circle"; options?: { initialRadiusInKm?: number } };

/** Hook for Drawing Mode */
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
      "useDrawingMode must be used within DrawingModeContextProvider",
    );
  }

  const { draw, isMapLoaded } = context;
  const { paralogMap: map } = useMap();
  const features = useSharedStore(useShallow(selector));

  const { setTooltip, removeTooltip } = useTooltips();

  /** Process Draw Events */
  const processDrawEvent = useCallback(
    (event: DrawUpdateEvent | DrawDeleteEvent, relevantFeatures: Feature[]) => {
      if (event.type === "draw.update") {
        onUpdateFeatures(relevantFeatures);
      } else if (event.type === "draw.delete") {
        const featureIds = relevantFeatures.map(({ id }) => id as string);
        onDeleteFeatures(featureIds);
        for (const id in featureIds) {
          removeTooltip(id);
        }
      }
    },
    [onUpdateFeatures, onDeleteFeatures, removeTooltip],
  );

  /** Handle Draw Event */
  const handleDrawEvent = useCallback(
    (event: DrawUpdateEvent | DrawDeleteEvent) => {
      const relevantFeatures = event.features.filter((feature) =>
        features.some((existing) => existing.id === feature.id),
      );
      if (relevantFeatures.length) {
        processDrawEvent(event, relevantFeatures);
      }
    },
    [features, processDrawEvent],
  );

  /** Start Drawing */
  const startDrawing = useCallback(
    ({ drawingMode, options }: UseDrawShapeOptions) => {
      const updateTooltip = (features: any[]) => {
        for (const feature of features) {
          if (
            feature.geometry.type === "Polygon" ||
            feature.properties?.type === "circle"
          ) {
            const id = feature.id;
            const center = turf_center(feature).geometry.coordinates as [
              number,
              number,
            ];
            const area = turf_area(feature) / 1_000_000;

            if (map && isMapLoaded) {
              new Popup({ closeButton: false })
                .setLngLat(center)
                .setText(`${area.toFixed(2)} km`)
                .addTo(map.getMap());
            }

            setTooltip(id, { center, area });
          }
        }
      };

      const handleDrawCreate = (event: DrawCreateEvent) => {
        onAddFeatures(event.features);
        if (drawingMode === "drag_circle") {
          updateTooltip(event.features);
        }
        map.off("draw.create", handleDrawCreate);
      };

      const handleModeChange = () => {
        map.off("draw.create", handleDrawCreate);
        map.off("draw.modechange", handleModeChange);
      };

      draw.changeMode(
        drawingMode,
        drawingMode === "draw_circle" ? options : undefined,
      );

      map.on("draw.delete", handleDrawEvent);
      map.on("draw.create", handleDrawCreate);
      map.on("draw.modechange", handleModeChange);
      if (drawingMode === "drag_circle") {
        map.on("draw.update", (e) => updateTooltip(e.features));
        map.on("draw.selectionchange", (e) => updateTooltip(e.features));
      }
    },
    [draw, map, onAddFeatures, handleDrawEvent, setTooltip, isMapLoaded],
  );

  /** Attach Event Listeners */
  useEffect(() => {
    if (!map) {
      return;
    }
    map.on("draw.update", handleDrawEvent);
    map.on("draw.delete", handleDrawEvent);
    return () => {
      map.off("draw.update", handleDrawEvent);
      map.off("draw.delete", handleDrawEvent);
    };
  }, [map, handleDrawEvent]);

  /** Redraw Features */
  useEffect(() => {
    if (!isMapLoaded) {
      return;
    }
    features.forEach(draw.add);
    return () => draw.delete(features.map(({ id }) => id as string));
  }, [draw, features, isMapLoaded]);

  return { startDrawing, features };
};
