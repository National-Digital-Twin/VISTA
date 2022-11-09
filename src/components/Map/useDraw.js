import MapboxDraw from "@mapbox/mapbox-gl-draw";
import * as turf from "@turf/turf";
import { useContext } from "react";
import { useControl } from "react-map-gl";
import { ElementsContext } from "context";
import { isEmpty } from "lodash";

const useDraw = () => {
  const { clearSelectedElements, onElementClick } = useContext(ElementsContext);

  const selectElemsInPolygon = (event, feature) => {
    const { target } = event;
    const search = turf.polygon(feature.geometry.coordinates);
    const points = turf.pointsWithinPolygon(target.getSource("all-assets")?._data, search);
    return points.features.map((feature) => ({ ...feature.properties.element }));
  };

  const searchAllPolygons = ( event ) => {
    if (isEmpty(event.features)) return;
    const assets = event.features.flatMap(( feature ) => {
      return selectElemsInPolygon( event, feature )
    });
    onElementClick(event, assets);
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
    () => new MapboxDraw({ displayControlsDefault: false }),
    ({ map }) => {
      // map.on("draw.create", onUpdatePolygon);
      map.on("draw.update", onUpdatePolygon);
      map.on("draw.delete", onDeletePolygon);
      map.on("draw.selectionchange", onSelectionChange);
    },
    ({ map }) => {
      // map.off("draw.create", onUpdatePolygon);
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

  const deleteAllPolygons = () => {
    draw.deleteAll();
  };

  return { activatePolygonMode, activateSimpleSelectMode, deleteAllPolygons };
};

export default useDraw;
