import React, { useEffect, useReducer } from "react";
import ReactMapGL, { NavigationControl, Layer, Source } from "react-map-gl";
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
    case UPDATE_ASSET_FEATURES:
      const agjCopy = { ...state.assetsGeoJSON };
      agjCopy.features = action.payload;
      return {
        ...state,
        assetsGeoJSON: agjCopy,
      };
    case UPDATE_VIEWPORT:
      return {
        ...state,
        viewport: { ...action.payload },
      };
    default:
      return state;
  }
};

const TelicentMap = ({ element }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const getFocussedAsset = (element) => {
    console.log(element);
    const { lineAssets, markerAssets } = element.generateMapboxFeatures();
    dispatch({
      type: UPDATE_LINE_FEATURES,
      payload: lineAssets,
    });

    dispatch({
      type: UPDATE_ASSET_FEATURES,
      payload: markerAssets,
    });
  };

  const getFocussedConnection = (connection) => {
    const { lineAssets, markerAssets } = connection.generateMapboxFeatures();
    dispatch({
      type: UPDATE_LINE_FEATURES,
      payload: lineAssets,
    });

    dispatch({
      type: UPDATE_ASSET_FEATURES,
      payload: markerAssets,
    });
  };

  useEffect(() => {
    if (!element || !element.category) return;

    if (element.category === "connection") {
      getFocussedConnection(element);
    } else {
      getFocussedAsset(element);
    }
  }, [element]);

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
    paint: {
      "circle-radius": ["get", "size"],
      "circle-color": ["get", "color"],
    },
  };

  return (
    <ReactMapGL
      {...state.viewport}
      mapboxAccessToken={config.mb.token}
      mapStyle="mapbox://styles/mapbox/dark-v10"
      onResize={onHandleViewportResize}
      onDrag={handleViewport}
      onZoom={handleViewport}
      onRotate={handleViewport}
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
