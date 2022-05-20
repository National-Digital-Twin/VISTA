import React, { useEffect, useRef } from "react";
import DeckGL from "@deck.gl/react";
import { LineLayer } from "@deck.gl/layers";
import ReactMapGL, { Marker, Source, Layer } from "react-map-gl";
import config from "../config/app-config";

const isNumber = (value) => typeof value === "number";

const TelicentMap = ({ element }) => {
  const mapRef = useRef();

  const viewState = {
    latitude: 51.509865,
    longitude: -0.118092,
    zoom: 10,
  };

  useEffect(() => {
    console.log(element);
    if (!mapRef.current || !element.lat || !element.lon) return;

    mapRef.current.setCenter([element.lon, element.lat]);
  }, [element]);

  const renderMarker = () => {
    if (!isNumber(element.lat) && !isNumber(element.lon)) {
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

  const data = [
    {
      sourcePosition: [-122.41669, 37.7853],
      targetPosition: [-122.41669, 37.781],
    },
  ];

  const layers = [new LineLayer({ id: "line-layer", data })];

  return (
    <DeckGL
      initialViewState={viewState}
      controller={true}
      layers={layers}
      style={{ position: "relative" }}
    >
      <ReactMapGL
        ref={mapRef}
        mapboxAccessToken={config.mb.token}
        mapStyle="mapbox://styles/mapbox/dark-v10"
      >
        {element && renderMarker()}
      </ReactMapGL>
    </DeckGL>
  );
};

const TelicentMemoMap = React.memo(TelicentMap);

export default TelicentMemoMap;
