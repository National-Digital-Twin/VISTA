import React, { useEffect, useReducer } from "react";
import ReactMapGL, { NavigationControl, Layer, Source } from "react-map-gl";
import { IsEmpty } from "../utils";
import config from "../config/app-config";

const UPDATE_LINE_FEATURES = "UPDATE_LINE_FEATURES";
const UPDATE_ASSET_FEATURES = "UPDATE_ASSET_FEATURES";
const UPDATE_VIEWPORT = "UPDATE_VIEWPORT";

const initialState = {
  lineStyle: {
    id: "line",
    type: "line",
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-width": 1,
      "line-color": ["get", "color"],
    },
  },
  markerStyle: {
    id: "marker",
    type: "circle",
    paint: {
      "circle-radius": {
        base: 1.75,
        stops: [
          [12, 2],
          [22, 180],
        ],
      },
      "circle-color": ["get", "color"],
    },
  },
  connectionsGeoJSON: {
    type: "FeatureCollection",
    features: [],
  },
  assetsGeoJSON: {
    type: "FeatureCollection",
    features: [],
  },
  viewport: {
    latitude: 50.66206632912732,
    longitude: -1.3480234953335598,
    zoom: 9,
    height: "100%",
    width: "100%",
  },
};

const reducer = (state, action) => {
  switch (action.type) {
    case UPDATE_LINE_FEATURES:
      const cgjCopy = { ...state.connectionsGeoJSON };
      cgjCopy.features = action.payload;
      return {
        ...state,
        connectionsGeoJSON: cgjCopy,
      };
    case UPDATE_VIEWPORT:
      return {
        ...state,
        viewport: { ...action.payload },
      };
  }
};

const buildFeatures = (assets) =>
  assets.map((asset) => ({
    type: "Feature",
    properties: {
      name: asset.uri,
      color: asset.getScoreColour(),
    },
    geometry: {
      type: "LineString",
      coordinates: asset.getCoordinates(),
    },
  }));

const TelicentMap = ({ element, connections = [] }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const getFocussedConnection = (element, connections = []) => {
    // if assets draw circles
    console.log(element);

    // if asset has segments draw linstring

    const features = [];
    // if connection draw linestring and assets
    console.log(features);
    dispatch({
      type: UPDATE_LINE_FEATURES,
      payload: features,
    });
  };

  useEffect(() => {
    if (!element || !element.category) return;

    getFocussedConnection(element, connections);
  }, [element, connections]);

  const onHandleViewportResize = () => {
    dispatch({ type: UPDATE_VIEWPORT, payload: state.viewport });
  };

  const handleViewport = (e) => {
    const viewport = { e };
    dispatch({ type: UPDATE_VIEWPORT, payload: viewport });
  };
  const markerStyle = {
    id: "marker",
    type: "circle",
  };

  return (
    <ReactMapGL
      {...state.viewport}
      mapboxAccessToken={config.mb.token}
      mapStyle="mapbox://styles/mapbox/dark-v10"
      onResize={onHandleViewportResize}
      onDrag={handleViewport}
    >
      <NavigationControl />
      <Source id="connections" type="geojson" data={state.connectionsGeoJSON}>
        <Layer {...state.lineStyle}></Layer>
      </Source>
      <Source id="assets" type="geojson" data={state.assetsGeoJSON}>
        <Layer {...markerStyle} />
      </Source>
    </ReactMapGL>
  );
};

const TelicentMemoMap = React.memo(TelicentMap);
export default TelicentMemoMap;
