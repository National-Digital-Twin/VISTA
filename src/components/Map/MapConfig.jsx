import { isEmpty } from "lodash";
import { Popup, useMap } from "react-map-gl";
import React, { useState } from "react";
import useDraw from "./useDraw";
import MapToolbar from "./MapToolbar";

const MapConfig = () => {
  const { telicentMap: map } = useMap();
  // console.log(map?.getMap())
  const [polygonsConfig, setPolygonsConfig] = useState([]);

  const {
    activateDrawCircleMode,
    activatePolygonMode,
    deleteAllPolygons,
    setRadius,
  } = useDraw(setPolygonsConfig);

  return (
    <>
      <PolygonInfo map={map} polygonsInfo={polygonsConfig} setRadius={setRadius} />
      <MapToolbar
        activateDrawCircleMode={activateDrawCircleMode}
        activatePolygonMode={activatePolygonMode}
        deleteAllPolygons={deleteAllPolygons}
      />
    </>
  );
};

export default MapConfig;

const PolygonInfo = ({ map, polygonsInfo, setRadius }) => {
  if (isEmpty(polygonsInfo)) return null;

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

  return polygonsInfo.map((info) => {
    const { center, radius } = info.generateCircleInfo();
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
              // onFocus={() => {
              //   console.log("make sure only this feature is selected", info.geojson.id);
              //   selectFocused(info.geojson.id)
              // }}
              onKeyDown={(event) => handleOnKeyDown(event, info.geojson)}
              // onBlur={(event) => handleRadiusChange(info.geojson, event.target.value)}
              className="bg-transparent border border-whiteSmoke-400 p-1 text-center rounded-md w-16"
              required
              autoFocus={false}
            />
          </label>
        </div>
      </Popup>
    );
  });
};
