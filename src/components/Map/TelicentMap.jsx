import React, { useEffect, useReducer } from "react";
import { Layer, Map, MapProvider, Source } from "react-map-gl";
import config from "../../config/app-config";
import { useLocalStorage } from "../../hooks";
import { getMapStyles } from "./mapStyles";
import MapToolbar from "./MapToolbar";

const UPDATE_FEATURES = "UPDATE_FEATURES";
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
    case UPDATE_FEATURES:
      const cgjCopy = { ...state.connectionsGeoJSON };
      const agjCopy = { ...state.assetsGeoJSON };
      cgjCopy.features = action.payload.lines;
      agjCopy.features = action.payload.markers;
      return {
        ...state,
        connectionsGeoJSON: cgjCopy,
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
  const [mapStyle, setMapStyle] = useLocalStorage("mapStyle", "mapbox://styles/mapbox/dark-v10");
  useEffect(() => {
    if(!getMapStyles().some(style=> style.id === mapStyle)){
      setMapStyle(getMapStyles()[0].id)
    }
  }, [mapStyle, setMapStyle])
  const getFocussedAsset = (element) => {
    const { lineAssets, markerAssets } = element.generateMapboxFeatures();
    dispatch({
      type: UPDATE_FEATURES,
      payload: {
        lines: lineAssets,
        markers: markerAssets,
      },
    });
  };

  const getFocussedConnection = (connection) => {
    const { lineAssets, markerAssets } = connection.generateMapboxFeatures();
    dispatch({
      type: UPDATE_FEATURES,
      payload: {
        lines: lineAssets,
        markers: markerAssets,
      },
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
    <div className="relative h-full">
      <MapProvider>
        <Map
          id="telicentMap"
          {...state.viewport}
          mapboxAccessToken={config.mb.token}
          mapStyle={mapStyle}
          onResize={onHandleViewportResize}
          onDrag={handleViewport}
          onZoom={handleViewport}
          onRotate={handleViewport}
          styleDiffing
        >
          <Source id="connections" type="geojson" data={state.connectionsGeoJSON}>
            <Layer {...state.lineStyle}></Layer>
          </Source>
          <Source id="assets" type="geojson" data={state.assetsGeoJSON}>
            <Layer {...markerStyle} />
          </Source>
        </Map>
        <MapToolbar mapStyle={mapStyle} setMapStyle={setMapStyle} />
      </MapProvider>
    </div>
  );
};

const TelicentMemoMap = React.memo(TelicentMap);
export default TelicentMemoMap;
