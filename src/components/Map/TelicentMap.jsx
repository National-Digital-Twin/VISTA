import React, { useContext, useEffect, useMemo, useState } from "react";
import Map, { Layer, Source } from "react-map-gl";

import config from "config/app-config";
import { CytoscapeContext, ElementsContext } from "context";
import { useLocalStorage } from "hooks";
import { allAssetsLayerStyle, highlightedAssets, lineStyle, segmentStyle } from "./layerStyles";
import {
  createSelectedAssetFeatures,
  createSelectedConnectionFeatures,
  createSelectedSegmentFeatures,
  generateAssetFeatures,
} from "./mapboxFeatures";
import { getMapStyles } from "./mapStyles";
import MapConfig from "./MapConfig";

const GEOJSON = "geojson";
const FEATURE_COLLECTION = "FeatureCollection";
const VIEWSTATE = {
  latitude: 50.66206632912732,
  longitude: -1.3480234953335598,
  zoom: 9,
};

const TelicentMap = () => {
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
  const [selectedCxns, setSelectedAssetCxns] = useState([]);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [selectedSegments, setSelectedSegments] = useState([]);

  const sources = [
    { id: "assets", features: assetFeatures, layers: [allAssetsLayerStyle] },
    { id: "selected-connections", features: selectedCxns, layers: [lineStyle] },
    { id: "selected-segments", features: selectedSegments, layers: [segmentStyle] },
    { id: "selected-assets", features: selectedAssets, layers: [highlightedAssets] },
  ];

  useEffect(() => {
    if (!getMapStyles().some((style) => style.id === mapStyle)) {
      setMapStyle(getMapStyles()[0].id);
    }
  }, [mapStyle, setMapStyle]);

  useEffect(() => {
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

    const polygonControl = event.target._controls.filter((item) =>
      item?.types?.POLYGON ? item : null
    );

    if (polygonControl[0].getSelected().features.length === 0 && !clickedFeature) {
      clearSelectedElements();
    }

    if (clickedFeature) {
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
        <MapConfig />
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
