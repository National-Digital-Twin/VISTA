import { Popup } from "react-map-gl";
import React, { useState } from "react";
import useDraw from "./useDraw";
import MapToolbar from "./MapToolbar";

const MapConfig = ({ heatmapRadius, map, mapStyle, setMapStyle }) => {
  const [polygon, setPolygon] = useState(undefined);
  const { activateDrawCircleMode, activatePolygonMode, deleteAllPolygons, setRadius } =
    useDraw(setPolygon);

  const handleOnPopupClose = () => {
    setPolygon(undefined);
  };

  return (
    <>
      <RadiusConfig polygon={polygon} onClose={handleOnPopupClose} setRadius={setRadius} />
      <MapToolbar
        heatmapRadius={heatmapRadius}
        map={map}
        mapStyle={mapStyle}
        activateDrawCircleMode={activateDrawCircleMode}
        activatePolygonMode={activatePolygonMode}
        deleteAllPolygons={deleteAllPolygons}
        setMapStyle={setMapStyle}
      />
    </>
  );
};
export default MapConfig;

const RadiusConfig = ({ polygon, setRadius, onClose }) => {
  if (!polygon?.properties?.center && !polygon?.properties?.circleRadius) return null;
  const { center, circleRadius: radius } = polygon.properties;

  const handleRadiusChange = (geojson, enteredRadius) => {
    const fEnteredR = parseFloat(enteredRadius);
    if (Number.isNaN(fEnteredR) || fEnteredR <= 0) return;
    const radius = Math.fround(fEnteredR).toFixed(3);
    setRadius({ geojson, radius: parseFloat(radius), manualEdit: true });
  };

  const handleOnKeyDown = (event, geojson) => {
    console.log(event);
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
