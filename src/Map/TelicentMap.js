import React, { useEffect, useState, useReducer } from "react";
import ReactMapGL, { NavigationControl, Layer, Source } from "react-map-gl";
import { IsEmpty } from "../utils";
import config from "../config/app-config";
import { clearStorage } from "mapbox-gl";

const UPDATE_LINE_STYLE = "UPDATE_LINE_STYLE";
const UPDATE_LINE_FEATURES = "UPDATE_LINE_FEATURES";
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
      "line-color": "#888",
      "line-width": 1,
    },
  },
  connectionsGeoJSON: {
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
    case UPDATE_LINE_STYLE:
      const lineStyleCopy = { ...state.lineStyle };
      lineStyleCopy.paint["line-color"] = action.payload;
      return {
        ...state,
        lineStyle: lineStyleCopy,
      };

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

const TelicentMap = ({ element, connections = [] }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const getFocussedConnection = (element, connections = []) => {
    const connection = connections.find(
      (connection) =>
        connection.sourceAsset.uri === element.uri ||
        connection.targetAsset.uri === element.uri
    );

    if (connection) {
      dispatch({ type: UPDATE_LINE_STYLE, payload: "#f00" });
      dispatch({
        type: UPDATE_LINE_FEATURES,
        payload: {
          type: "Feature",
          properties: {
            name: connection.uri,
          },
          geometry: {
            type: "LineString",
            coordinates: connection.getCoordinates(),
          },
        },
      });
    }
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
  console.log(state);
  return (
    <ReactMapGL
      {...state.viewport}
      mapboxAccessToken={config.mb.token}
      mapStyle="mapbox://styles/mapbox/dark-v10"
      onResize={onHandleViewportResize}
      onDrag={handleViewport}
    >
      <NavigationControl />
      {/* <Source id="connections" type="geojson" data={state.connectionsGeoJSON}> */}
      {/* <Layer {...state.lineStyle}></Layer> */}
      {/* </Source> */}
      {/* <Source id="assets" type="geojson" data={assets}> */}
      {/* <Layer {...markerStyle} /> */}
      {/* </Source> */}
    </ReactMapGL>
  );
};

const TelicentMemoMap = React.memo(TelicentMap);
export default TelicentMemoMap;
