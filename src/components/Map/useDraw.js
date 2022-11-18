import { isEmpty } from "lodash";
import { useContext } from "react";
import { useControl } from "react-map-gl";
import * as MapboxDrawGeodesic from "mapbox-gl-draw-geodesic";
import * as turf from "@turf/turf";
import MapboxDraw from "@mapbox/mapbox-gl-draw";

import { ElementsContext } from "context";
import { Polygon } from "models";

const DRAW_CIRCLE = "draw_circle";

let modes = MapboxDraw.modes;
modes = MapboxDrawGeodesic.enable(modes);

const useDraw = (setPolygonsInfo, map) => {
  const { clearSelectedElements, onMultiSelect } = useContext(ElementsContext);

  const getAssetsInPolygon = (target, polygon) => {
    const points = turf.pointsWithinPolygon(target.getSource("assets")?._data, polygon);
    return points.features.map((feature) => ({ ...feature.properties.element }));
  };

  const assetsInPolygon = (event, feature) => {
    const { target } = event;
    if (MapboxDrawGeodesic.isCircle(feature)) {
      const center = MapboxDrawGeodesic.getCircleCenter(feature);
      const radius = MapboxDrawGeodesic.getCircleRadius(feature);
      const circle = turf.circle(center, radius, { steps: 50, units: "kilometers" });
      return getAssetsInPolygon(target, circle);
    }

    const polygon = turf.polygon(feature.geometry.coordinates);
    return getAssetsInPolygon(target, polygon);
  };

  const selectAssetsInPolygons = (event) => {
    if (isEmpty(event.features)) return;
    const assets = event.features.flatMap((feature) => {
      // const roundedRadius = parseFloat(Math.fround(feature.properties.circleRadius).toFixed(2));
      // setRadius({ geojson: feature, radius: roundedRadius, manualEdit: false });
      return assetsInPolygon(event, feature);
    });
    onMultiSelect(assets);
    getSelectedPolygon();
  };

  const onClick = (event) => {
    const { lngLat, features } = event;
    if (!features) setPolygonsInfo([]);
    if (draw.getMode() === DRAW_CIRCLE) {
      let radius = 1;
      if (event.target.transform.zoom > 14) radius = 0.05;
      const circle = MapboxDrawGeodesic.createCircle([lngLat.lng, lngLat.lat], radius);
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

  const activatePolygonMode = () => {
    draw.changeMode(draw.modes.DRAW_POLYGON);
  };

  const activateSimpleSelectMode = () => {
    draw.changeMode(draw.modes.SIMPLE_SELECT);
  };

  const activateDrawCircleMode = () => {
    draw.changeMode(DRAW_CIRCLE);
  };

  const deleteAllPolygons = () => {
    draw.deleteAll();
    clearSelectedElements();
  };

  const getSelectedPolygon = () => {
    const selectedPolygons = draw.getSelected().features;
    const info = selectedPolygons.map((polygon) => new Polygon({ geojson: polygon }));
    setPolygonsInfo(info);
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
      console.log("manual edit");
      draw.changeMode("simple_select").changeMode("direct_select", { featureId: featureIds[0] });
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
