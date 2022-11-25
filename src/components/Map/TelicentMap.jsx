import React, { useContext, useEffect, useMemo, useState } from "react";
import Map, { Layer, Source, ScaleControl, useMap } from "react-map-gl";
import { isEmpty } from "lodash";

import config from "config/app-config";
import { CytoscapeContext, ElementsContext } from "context";
import { useLocalStorage } from "hooks";

import {
  allAssetsLayerStyle,
  heatmap,
  highlightedAssets,
  lineStyle,
  segmentStyle,
} from "./layerStyles";
import {
  createSelectedAssetFeatures,
  createSelectedConnectionFeatures,
  createSelectedSegmentFeatures,
  generateAssetFeatures,
} from "./mapboxFeatures";
import { getMapStyles } from "./mapStyles";
import MapConfig from "./MapConfig";
import "./mapbox.css";

const GEOJSON = "geojson";
const FEATURE_COLLECTION = "FeatureCollection";
const VIEWSTATE = {
  latitude: 50.66206632912732,
  longitude: -1.3480234953335598,
  zoom: 9,
};
const HEAT_RADIUS = 1000;

const TelicentMap = () => {
  const { telicentMap: map } = useMap();
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
  const [mapStyle, setMapStyle] = useLocalStorage("mapStyle", "mapbox://styles/mapbox/dark-v10");

  const [cursor, setCursor] = useState("auto");
  const [hoverInfo, setHoverInfo] = useState(undefined);
  const [heatmapRadius, setHeatmapRadius] = useState(10);
  const [selectedAssetCxns, setSelectedAssetCxns] = useState([]);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [selectedSegments, setSelectedSegments] = useState([]);

  const assetFeatures = useMemo(() => generateAssetFeatures(assets), [assets]);

  // The order of the array is the order in which the features will appear in the map.
  // index 0 being the lowest level
  const sources = [
    { id: "assets", features: assetFeatures, layers: [heatmap, allAssetsLayerStyle] },
    { id: "selected-connections", features: selectedAssetCxns, layers: [lineStyle] },
    { id: "selected-segments", features: selectedSegments, layers: [segmentStyle] },
    { id: "selected-assets", features: selectedAssets, layers: [highlightedAssets] },
  ];

  useEffect(() => {
    if (!getMapStyles().some((style) => style.id === mapStyle)) {
      setMapStyle(getMapStyles()[0].id);
    }
  }, [mapStyle, setMapStyle]);

  useEffect(() => {
    if (isEmpty(assets) && isEmpty(selectedElements)) return;
    const selectedAssetFeatures = createSelectedAssetFeatures(
      assets,
      assetCriticalityColorScale,
      maxAssetCriticality,
      selectedElements
    );
    setSelectedAssets(selectedAssetFeatures);

    const selectedSegmentFeatures = createSelectedSegmentFeatures(
      selectedElements,
      assetCriticalityColorScale,
      assets
    );
    setSelectedSegments(selectedSegmentFeatures);

    const selectedAssetCxnFeatures = createSelectedConnectionFeatures(
      assets,
      cxnCriticalityColorScale,
      selectedElements
    );
    setSelectedAssetCxns(selectedAssetCxnFeatures);
  }, [
    assets,
    cxnCriticalityColorScale,
    assetCriticalityColorScale,
    maxAssetCriticality,
    selectedElements,
  ]);

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

    if (clickedFeature?.type === "Feature") {
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

  const handleOnZoom = (event) => {
    const { pixelsPerMeter } = event.target.transform;
    const radius = HEAT_RADIUS * pixelsPerMeter;
    map.getMap().setPaintProperty(heatmap.id, "heatmap-radius", radius);
    setHeatmapRadius(radius);
  };

  return (
    <div className="relative w-full">
      <Map
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
        onZoom={handleOnZoom}
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
        <ScaleControl
          position="top-left"
          style={{
            backgroundColor: "#27272780",
            color: "#F5F5F5",
            borderColor: "#949494",
            fontFamily: "Urbanist",
            letterSpacing: "1.5px",
          }}
        />
        <HoverInfo
          info={hoverInfo?.feature.properties.element}
          left={hoverInfo?.x}
          top={hoverInfo?.y}
        />
        <MapConfig
          heatmapRadius={heatmapRadius}
          map={map}
          mapStyle={mapStyle}
          setMapStyle={setMapStyle}
        />
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
