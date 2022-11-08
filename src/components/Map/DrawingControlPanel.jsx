/* eslint jsx-a11y/anchor-has-content: 0 */
import React from "react";
import * as turf from "@turf/turf";
import { useControl } from "react-map-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";

const DrawingControlPanel = ({onElementClick}) => {

  const onUpdatePolygon = (e) => {
    const subjects = e.features
    const map = e.target
    if(Array.isArray(subjects) &&  subjects.length > 0){
      const search = turf.polygon(subjects[0].geometry.coordinates)
      const points = turf.pointsWithinPolygon(map.getSource("all-assets")?._data, search)
      const assets = points.features.map(feature => feature.properties.element)
      onElementClick(e, ...assets)
    }
  };

  const onDeletePolygon = (e) => {
    onElementClick(e, [])
  };

  useControl(
     ({map}) => {
      map.on("draw.create", onUpdatePolygon);
      map.on("draw.update", onUpdatePolygon);
      map.on("draw.delete", onDeletePolygon);
      const draw = new MapboxDraw({
        displayControlsDefault: false,
      });
      return draw
    },({map}) => {
      map.off("draw.create", onUpdatePolygon);
      map.off("draw.update", onUpdatePolygon);
      map.off("draw.delete", onDeletePolygon);
    },
    {
      position: "top-left",
    }
  );

  let polygonArea = 0;

  return (
    <div
      className=""
      style={{ position: "absolute", top: 0, right: 0, maxWidth: "320px" }}
    >
      {polygonArea > 0}
    </div>
  );
};

export default DrawingControlPanel;
