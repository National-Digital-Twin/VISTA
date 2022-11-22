import React, { useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import Map, { Layer, Source } from "react-map-gl";

import config from "config/app-config";
import { CytoscapeContext, ElementsContext } from "context";
import { useLocalStorage } from "hooks";
import { allAssetsLayerStyle, highlightedAssets, lineStyle, segmentStyle } from "./layerStyles";
import { generateAssetFeatures } from "./mapboxFeatures";
import { getMapStyles } from "./mapStyles";
import MapConfig from "./MapConfig";
import "./mapbox.css";
import mapReducer, { HIGHLIGHT_SELECTED_ELEMENTS, INITIAL_STATE, UPDATE_SELECTED_POLYGONS } from "./map-reducer";
import { isEmpty } from "lodash";
import { useCallback } from "react";

const GEOJSON = "geojson";
const FEATURE_COLLECTION = "FeatureCollection";
const VIEWSTATE = {
  latitude: 50.66206632912732,
  longitude: -1.3480234953335598,
  zoom: 9,
};

const TelicentMap = () => {
  const mapRef = useRef();
  const { clearSelected } = useContext(CytoscapeContext);
  const {
    assets,
    selectedElements,
    assetCriticalityColorScale,
    cxnCriticalityColorScale,
    maxAssetCriticality,
    clearSelectedElements,
    onElementClick,
  } = useContext(ElementsContext);

  const assetFeatures = useMemo(() => generateAssetFeatures(assets), [assets]);

  const [cursor, setCursor] = useState("auto");
  const [hoverInfo, setHoverInfo] = useState(undefined);
  const [mapStyle, setMapStyle] = useLocalStorage("mapStyle", "mapbox://styles/mapbox/dark-v10");

  const [state, dispatch] = useReducer(mapReducer, INITIAL_STATE);
  const { selectedAssets, selectedDependacies, selectedSegments, selectedPolygons } = state;

  // The order of the array is the order in which the features will appear in the map.
  // index 0 being the lowest level
  const sources = [
    { id: "assets", features: assetFeatures, layers: [allAssetsLayerStyle] },
    { id: "selected-connections", features: selectedDependacies, layers: [lineStyle] },
    { id: "selected-segments", features: selectedSegments, layers: [segmentStyle] },
    { id: "selected-assets", features: selectedAssets, layers: [highlightedAssets] },
  ];

  useEffect(() => {
    if (!getMapStyles().some((style) => style.id === mapStyle)) {
      setMapStyle(getMapStyles()[0].id);
    }
  }, [mapStyle, setMapStyle]);

  useEffect(() => {
    dispatch({
      type: HIGHLIGHT_SELECTED_ELEMENTS,
      assets,
      selectedElements,
      maxAssetCriticality,
      assetCriticalityColorScale,
      cxnCriticalityColorScale,
    });
  }, [
    assets,
    cxnCriticalityColorScale,
    assetCriticalityColorScale,
    maxAssetCriticality,
    selectedElements,
  ]);

  const updateSelectedPolygons = useCallback((selectedPolygons) => {
    dispatch({ type: UPDATE_SELECTED_POLYGONS, selectedPolygons})
  }, []);

  const handleOnClick = (event) => {
    const { features } = event;
    const clickedFeature = features && features[0];
    clearSelected();

    const controls = event.target._controls;
    const drawControl = Object.values(controls).find((item) => item.modes);
    const polygons = drawControl.getAll().features;

    if (!clickedFeature && isEmpty(polygons)) {
      clearSelectedElements();
      return;
    }

    if (!isEmpty(polygons)) {
      updateSelectedPolygons(drawControl.getSelected().features)
      return;
    }

    if (clickedFeature && clickedFeature.type === "Feature") {
      const { properties } = clickedFeature;
      event.originalEvent.stopPropagation();
      const element = JSON.parse(properties.element);
      onElementClick(event, element);
      return;
    }
  };

  const handleOnMouseMove = (event) => {
    const {
      features,
      point: { x, y },
    } = event;
    const hoveredFeature = features && features[0];
    setHoverInfo(hoveredFeature && { feature: hoveredFeature, x, y });
  };

  const resetCursor = () => {
    setCursor("auto");
  };

  return (
    <div className="relative w-full">
      <Map
        ref={mapRef}
        cursor={cursor}
        id="telicentMap"
        interactiveLayerIds={[allAssetsLayerStyle.id]}
        initialViewState={{ ...VIEWSTATE }}
        mapboxAccessToken={config.mb.token}
        mapStyle={mapStyle}
        onClick={handleOnClick}
        onDragStart={() => setCursor("move")}
        onDragEnd={resetCursor}
        onMouseEnter={() => setCursor("pointer")}
        onMouseLeave={resetCursor}
        onMouseMove={handleOnMouseMove}
        boxZoom={false}
      >
        {sources.map((source) => (
          <Source
            key={source.id}
            id={source.id}
            type={GEOJSON}
            data={{ type: FEATURE_COLLECTION, features: source.features }}
          >
            {source.layers.map((layer) => (
              <Layer key={layer.id} {...layer} />
            ))}
          </Source>
        ))}
        <HoverInfo
          info={hoverInfo?.feature.properties.element}
          left={hoverInfo?.x}
          top={hoverInfo?.y}
        />
        <MapConfig polygons={selectedPolygons} setPolygons={updateSelectedPolygons} />
      </Map>
    </div>
  );
};

export default TelicentMap;

const HoverInfo = ({ info, left, top }) => {
  if (!info) return null;
  const assetInfo = JSON.parse(info);

  return (
    <div
      className="bg-black-50 text-whiteSmoke absolute font-body text-sm px-2 py-1 rounded-md"
      style={{ left: left + 10, top: top + 8 }}
    >
      <p>ID: {assetInfo.label}</p>
      <p>Name: {assetInfo.name}</p>
      <p>Criticality: {assetInfo.criticality}</p>
    </div>
  );
};
