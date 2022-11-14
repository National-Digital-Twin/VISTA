import { isEmpty } from "lodash";
import { useContext } from "react";
import { useControl } from "react-map-gl";
import * as MapboxDrawGeodesic from "mapbox-gl-draw-geodesic";
import * as turf from "@turf/turf";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { ElementsContext } from "context";

let modes = MapboxDraw.modes;
modes = MapboxDrawGeodesic.enable(modes);

const useDraw = () => {
  const { clearSelectedElements, onMultiSelect } = useContext(ElementsContext);

  const assetsInPolygon = (event, feature) => {
    const { target } = event;
    if (MapboxDrawGeodesic.isCircle(feature)) {
      const center = MapboxDrawGeodesic.getCircleCenter(feature);
      const radius = MapboxDrawGeodesic.getCircleRadius(feature);
      const options = { steps: 10, units: "kilometers" };
      const circle = turf.circle(center, radius, options);
      
      const points = turf.pointsWithinPolygon(target.getSource("all-assets")?._data, circle);
      return points.features.map((feature) => ({ ...feature.properties.element }));
    }
    const polygon = turf.polygon(feature.geometry.coordinates);
    const points = turf.pointsWithinPolygon(target.getSource("all-assets")?._data, polygon);
    return points.features.map((feature) => ({ ...feature.properties.element }));
  };

  const searchAllPolygons = (event) => {
    if (isEmpty(event.features)) return;
    const assets = event.features.flatMap((feature) => {
      return assetsInPolygon(event, feature);
    });
    onMultiSelect(assets);
  };

  const onSelectionChange = (event) => {
    searchAllPolygons(event);
  };

  const onUpdatePolygon = (event) => {
    searchAllPolygons(event);
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
    },
    ({ map }) => {
      map.off("draw.create", onUpdatePolygon);
      map.off("draw.update", onUpdatePolygon);
      map.off("draw.delete", onDeletePolygon);
      map.off("draw.selectionchange", onSelectionChange);
    }
  );

  const activatePolygonMode = () => {
    const drawPolygonMode = draw.modes.DRAW_POLYGON;
    draw.changeMode(drawPolygonMode);
  };

  const activateSimpleSelectMode = () => {
    const simpleSelectMode = draw.modes.SIMPLE_SELECT;
    draw.changeMode(simpleSelectMode);
  };

  const activateDrawCircleMode = () => {
    draw.changeMode("draw_circle");
    // console.log({ modes: MapboxDrawGeodesic.con, draw, modes1: modes });
  };

  const deleteAllPolygons = () => {
    draw.deleteAll();
    clearSelectedElements();
  };

  return {
    activateDrawCircleMode,
    activatePolygonMode,
    activateSimpleSelectMode,
    deleteAllPolygons,
  };
};

export default useDraw;
