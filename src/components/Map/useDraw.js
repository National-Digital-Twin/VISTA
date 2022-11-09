import MapboxDraw from "@mapbox/mapbox-gl-draw";
import * as turf from "@turf/turf";
import { useContext, useEffect, useState } from "react";
import { useControl } from "react-map-gl";
import { ElementsContext } from "context";
import { isEmpty } from "lodash";

const useDraw = () => {
  const [assetsWithinPolygon, setAssetsWithinPolygon] = useState([]);
  const { clearSelectedElements, onElementClick } = useContext(ElementsContext);

  // useEffect(() => {
  //   if (assetsWithinPolygon.length > 0) onElementClick(undefined, assetsWithinPolygon);
  // }, [assetsWithinPolygon, onElementClick]);

  const selectElemsInPolygon = (event) => {
    const { features, target } = event;
    console.log({ features, points: event.points })
    if (isEmpty(features)) return;

    const search = turf.polygon(features[0].geometry.coordinates);
    const points = turf.pointsWithinPolygon(target.getSource("all-assets")?._data, search);
    const assets = points.features.map((feature) => ({ ...feature.properties.element }));
    onElementClick(event, assets)
  };

  const onSelectionChange = (event) => {
    console.log("selecting", event);
    selectElemsInPolygon(event);
  };

  const onUpdatePolygon = (event) => {
    console.log("updating");
    selectElemsInPolygon(event);
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

  return { assetsWithinPolygon, activatePolygonMode, activateSimpleSelectMode, deleteAllPolygons };
};

export default useDraw;
