import { isEmpty } from "lodash";
import { Popup } from "react-map-gl";
import React from "react";
import useDraw from "./useDraw";
import MapToolbar from "./MapToolbar";

const MapConfig = ({ polygons, setPolygons }) => {
  const { activateDrawCircleMode, activatePolygonMode, deleteAllPolygons, setRadius } =
    useDraw(setPolygons);

  return (
    <>
      <RadiusConfig polygons={polygons} setRadius={setRadius} />
      <MapToolbar
        activateDrawCircleMode={activateDrawCircleMode}
        activatePolygonMode={activatePolygonMode}
        deleteAllPolygons={deleteAllPolygons}
      />
    </>
  );
};
export default MapConfig;

const RadiusConfig = ({ polygons, setRadius }) => {
  if (!polygons || isEmpty(polygons)) return null;

  const handleRadiusChange = (geojson, enteredRadius) => {
    const fEnteredR = parseFloat(enteredRadius);
    if (Number.isNaN(fEnteredR) || fEnteredR <= 0) return;
    const radius = Math.fround(fEnteredR).toFixed(2);
    setRadius({ geojson, radius: parseFloat(radius), manualEdit: true });
  };

  const handleOnKeyDown = (event, geojson) => {
    if (event.key === "Enter") {
      handleRadiusChange(geojson, event.target.value);
      return;
    }
  };

  return polygons
    .filter((polygon) => polygon.properties.center && polygon.properties.circleRadius)
    .map((polygon) => {
      const { center, circleRadius: radius } = polygon.properties;
      return (
        <Popup
          key={radius.toString()}
          longitude={center[0]}
          latitude={center[1]}
          closeButton={false}
          className="font-body text-sm"
        >
          <div className="flex flex-col gap-y-2 items-center">
            <div className="flex flex-col items-center">
              <p className="">Latitude: {center[1]}</p>
              <p className="">Longitude: {center[0]}</p>
            </div>
            <hr className="border-black-500 w-full" />
            <label className="flex items-center gap-x-1">
              <span>Radius (km)</span>
              <input
                type="number"
                min={1}
                step="0.05"
                defaultValue={radius}
                onKeyDown={(event) => handleOnKeyDown(event, polygon)}
                onBlur={(event) => handleRadiusChange(polygon, event.target.value)}
                className="bg-transparent border border-whiteSmoke-400 p-1 text-center rounded-md w-16"
                required
              />
            </label>
          </div>
        </Popup>
      );
    });
};
