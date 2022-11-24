import { useContext } from "react";
import { useControl } from "react-map-gl";
import * as MapboxDrawGeodesic from "mapbox-gl-draw-geodesic";
import * as turf from "@turf/turf";
import MapboxDraw from "@mapbox/mapbox-gl-draw";

import { ElementsContext } from "context";

const DRAW_CIRCLE = "draw_circle";

let modes = MapboxDraw.modes;
modes = MapboxDrawGeodesic.enable(modes);

const useDraw = (setPolygon) => {
  const { clearSelectedElements, onMultiSelect } = useContext(ElementsContext);

  const getAssetsInPolygon = (target, polygon) => {
    const points = turf.pointsWithinPolygon(target?.getSource("assets")?._data, polygon);
    return points.features.map((feature) => ({ ...feature.properties.element }));
  };

  const assetsInPolygon = (event, feature) => {
    const { target } = event;
    if (MapboxDrawGeodesic.isCircle(feature)) {
      const center = MapboxDrawGeodesic.getCircleCenter(feature);
      const radius = parseFloat(Math.fround(feature.properties.circleRadius).toFixed(2));
      feature.properties.center = center;
      setRadius({ geojson: feature, radius, manualEdit: false });

      const circle = turf.circle(center, radius, { steps: 50, units: "kilometers" });
      return getAssetsInPolygon(target, circle);
    }

    const polygon = turf.polygon(feature.geometry.coordinates);
    return getAssetsInPolygon(target, polygon);
  };

  const selectAssetsInPolygons = (event) => {
    setPolygon(undefined);
    const { features } = event;
    const assets = features.flatMap((feature) => assetsInPolygon(event, feature));
    onMultiSelect(assets);
    if (features.length === 1) {
      setPolygon(features[0]);
      return;
    }
  };

  const onClick = (event) => {
    const { lngLat } = event;
    if (draw.getMode() === DRAW_CIRCLE) {
      let radius = 2;
      if (event.target.transform.zoom > 14) radius = 0.05;
      const circle = MapboxDrawGeodesic.createCircle([lngLat.lng, lngLat.lat], radius);
      circle.properties.center = MapboxDrawGeodesic.getCircleCenter(circle);
      draw.add(circle);
      activateSimpleSelectMode();
    }
  };

  const onSelectionChange = (event) => {
    selectAssetsInPolygons(event);
  };

  const onUpdatePolygon = (event) => {
    selectAssetsInPolygons(event);
  };

  const onDeletePolygon = () => {
    clearSelectedElements();
  };

  const draw = useControl(
    () =>
      new MapboxDraw({
        displayControlsDefault: false,
        modes,
      }),
    ({ map }) => {
      map.on("draw.create", onUpdatePolygon);
      map.on("draw.update", onUpdatePolygon);
      map.on("draw.delete", onDeletePolygon);
      map.on("draw.selectionchange", onSelectionChange);
      map.on("click", onClick);
    },
    ({ map }) => {
      map.off("draw.create", onUpdatePolygon);
      map.off("draw.update", onUpdatePolygon);
      map.off("draw.delete", onDeletePolygon);
      map.off("draw.selectionchange", onSelectionChange);
      map.on("click", onClick);
    }
  );

  const SIMPLE_SELECT = draw?.modes?.SIMPLE_SELECT;

  const activatePolygonMode = () => {
    draw.changeMode(draw.modes.DRAW_POLYGON);
  };

  const activateSimpleSelectMode = () => {
    draw.changeMode(draw.modes.SIMPLE_SELECT);
  };

  const activateDrawCircleMode = () => {
    draw.changeMode(draw.modes.SIMPLE_SELECT);
  };

  const deleteAllPolygons = () => {
    draw.deleteAll();
    clearSelectedElements();
    setPolygon(undefined);
  };

  /**
   * This function is resposible for updating the radius of a selected circle based on user input
   * setCircleRadius updates the circleRadius property in the geojson provided
   * draw.changeMode is called to programatically select the feature
   * this triggers the draw.selectionchange event which then updates the selected feature to the entered radius
   */
  const setRadius = ({ geojson, radius, manualEdit }) => {
    MapboxDrawGeodesic.setCircleRadius(geojson, radius);
    const featureIds = draw.add(geojson);
    if (manualEdit) {
      draw.changeMode(SIMPLE_SELECT).changeMode(SIMPLE_SELECT, { featureIds: featureIds[0] })
    }
  };

  return {
    activateDrawCircleMode,
    activatePolygonMode,
    activateSimpleSelectMode,
    deleteAllPolygons,
    setRadius,
  };
};

export default useDraw;
