import React, { useEffect, useRef } from "react";
import ReactMapGL, { Marker } from "react-map-gl";
import config from "../config/app-config";

const TelicentMap = ({ element }) => {
  const mapRef = useRef();

  const viewState = {
    latitude: 51.509865,
    longitude: -0.118092,
    zoom: 10,
  };
  useEffect(() => {
    if (!mapRef.current || !element.lat || !element.lon) return;
    console.log(element);

    mapRef.current.setCenter([element.lon, element.lat]);
  }, [element]);

  const renderMarker = () => {
    if (!element.lat && !element.lon) {
      return null;
    }
    return (
      <Marker
        latitude={element.lat}
        longitude={element.lon}
        color={element.scoreColour}
        anchor="center"
        name={element.name}
      />
    );
  };

  return (
    <ReactMapGL
      initialViewState={viewState}
      ref={mapRef}
      mapboxAccessToken={config.mb.token}
      mapStyle="mapbox://styles/mapbox/dark-v10"
    >
      {/* {console.log(asset)} */}
      {element && renderMarker()}
    </ReactMapGL>
  );
};

const TelicentMemoMap = React.memo(TelicentMap);

export default TelicentMemoMap;
