import React, { useCallback, useContext, useEffect, useState } from "react";
import { Popup, useControl } from "react-map-gl";
import * as MapboxDrawGeodesic from "mapbox-gl-draw-geodesic";
import MapboxDraw from "@mapbox/mapbox-gl-draw";

import { CytoscapeContext, ElementsContext } from "context";
import { ToolbarButton } from "lib";
import { useElementsInPolygons } from "hooks";

import DrawingTools from "./DrawingTools";

export const DRAW_CIRCLE = "draw_circle";

let modes = MapboxDraw.modes;
modes = MapboxDrawGeodesic.enable(modes);

const DrawControls = ({ compact, map, setCursor }) => {
  const { fit, moveTo } = useContext(CytoscapeContext);
  const {
    assets,
    dependencies,
    selectedElements: cachedSelectedElements,
    clearSelectedElements,
    onAreaSelect,
  } = useContext(ElementsContext);

  const { findElementsInPolygons } = useElementsInPolygons();

  const [polygon, setPolygon] = useState(undefined);
  const [selectedTool, setSelectedTool] = useState(undefined);

  const draw = useControl(
    () =>
      new MapboxDraw({
        displayControlsDefault: false,
        modes,
      })
  );

  const SIMPLE_SELECT = draw?.modes?.SIMPLE_SELECT;
  const DRAW_POLYGON = draw?.modes?.DRAW_POLYGON;

  const onUpdate = useCallback(
    (event) => {
      const { features: polygons, target } = event;
      setPolygon(undefined);
      const elementsToSelect = findElementsInPolygons({ target, polygons, assets, dependencies });

      if (polygons.length === 1) {
        setPolygon(polygons[0]);
      }
      onAreaSelect(elementsToSelect);
      moveTo({
        areaSelect: true,
        cachedElements: cachedSelectedElements,
        selectedElements: elementsToSelect,
      });
    },
    [assets, dependencies, findElementsInPolygons, cachedSelectedElements, moveTo, onAreaSelect]
  );

  const onModeChange = useCallback(
    (event) => {
      const { mode } = event;
      if (mode === SIMPLE_SELECT) {
        setCursor("auto");
        setSelectedTool(undefined);
        return;
      }
    },
    [SIMPLE_SELECT, setCursor]
  );

  useEffect(() => {
    if (!map) return;
    map.on("draw.create", onUpdate);
    map.on("draw.update", onUpdate);
    map.on("draw.selectionchange", onUpdate);
    map.on("draw.modechange", onModeChange);
    return () => {
      map.off("draw.create", onUpdate);
      map.off("draw.update", onUpdate);
      map.off("draw.selectionchange", onUpdate);
      map.off("draw.modechange", onModeChange);
    };
  }, [map, onModeChange, onUpdate]);

  const handleDrawPolygon = () => {
    draw.changeMode(DRAW_POLYGON);
    setCursor("crosshair");
    setSelectedTool(DRAW_POLYGON);
  };

  const handleDrawCircle = () => {
    draw.changeMode(DRAW_CIRCLE);
    setCursor("crosshair");
    setSelectedTool(DRAW_CIRCLE);
  };

  const handleDeleteAllSelections = () => {
    draw.deleteAll();
    clearSelectedElements();
    setPolygon(undefined);
    fit();
    setCursor("auto");
    setSelectedTool(undefined);
  };

  /**
   * This function is resposible for updating the radius of a selected circle based on user input
   * setCircleRadius updates the circleRadius property in the geojson provided
   * draw.changeMode is called to programatically select the feature
   * this triggers the draw.selectionchange event which then updates the selected feature to the entered radius
   */
  const setRadius = ({ geojson, radius }) => {
    MapboxDrawGeodesic.setCircleRadius(geojson, radius);
    const featureIds = draw.add(geojson);
    draw.changeMode(SIMPLE_SELECT).changeMode(SIMPLE_SELECT, { featureIds: featureIds[0] });
  };

  const closePopup = () => {
    setPolygon(undefined);
  };

  return (
    <>
      <RadiusSelectionPopup polygon={polygon} setRadius={setRadius} onClose={closePopup} />
      <DrawingTools
        DRAW_POLYGON={DRAW_POLYGON}
        compact={compact}
        selectedTool={selectedTool}
        onDrawCircle={handleDrawCircle}
        onDrawPolygon={handleDrawPolygon}
      />
      <ToolbarButton icon="ri-delete-bin-line" label="Delete all polygons" onClick={handleDeleteAllSelections} />
    </>
  );
};

export default DrawControls;

const RadiusSelectionPopup = ({ polygon, setRadius, onClose }) => {
  if (!polygon?.properties?.center && !polygon?.properties?.radius) return null;
  const { center, radius } = polygon.properties;

  const handleRadiusChange = (geojson, enteredRadius) => {
    const fEnteredR = parseFloat(enteredRadius);
    if (Number.isNaN(fEnteredR) || fEnteredR <= 0) return;
    const radius = Math.fround(fEnteredR).toFixed(3);
    setRadius({ geojson, radius: parseFloat(radius), manualEdit: true });
  };

  const handleOnKeyDown = (event, geojson) => {
    if (event.key === "Enter") {
      handleRadiusChange(geojson, event.target.value);
      return;
    }
  };

  return (
    <Popup
      key={radius.toString()}
      longitude={center[0]}
      latitude={center[1]}
      className="font-body text-sm"
      focusAfterOpen={false}
      onClose={onClose}
    >
      <div className="flex flex-col gap-y-2 items-center mt-3">
        <div className="flex flex-col items-center justify-center">
          <p>Latitude: {center[1]}</p>
          <p>Longitude: {center[0]}</p>
        </div>
        <hr className="border-black-500 w-full" />
        <form
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <label className="flex items-center gap-x-1">
            <span>Radius (km)</span>
            <input
              type="number"
              min={0.001}
              step={0.001}
              defaultValue={radius}
              onKeyDown={(event) => handleOnKeyDown(event, polygon)}
              onBlur={(event) => handleRadiusChange(polygon, event.target.value)}
              className="bg-transparent border border-whiteSmoke-400 p-1 text-center rounded-md w-16 tl-input"
              required
            />
          </label>
        </form>
      </div>
    </Popup>
  );
};
