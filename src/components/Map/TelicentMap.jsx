import React, { useContext, useEffect, useState } from "react";
import Map, { Layer, MapProvider, Source } from "react-map-gl";
import config from "../../config/app-config";
import { CytoscapeContext, ElementsContext } from "../../context";
import { useLocalStorage } from "../../hooks";
import Asset from "../../models/Asset";
import { IsEmpty } from "../../utils";
import { allAssetsLayerStyle, highlightedAssets, lineStyle, segmentStyle } from "./layerStyles";
import {
  createSelectedAssetFeatures,
  createSelectedConnectionFeatures,
  createSelectedSegmentFeatures,
  generateAssetFeatures,
} from "./mapboxFeatures";
import MapToolbar from "./MapToolbar";

const GEOJSON = "geojson";
const FEATURE_COLLECTION = "FeatureCollection";
const VIEWSTATE = {
  latitude: 50.66206632912732,
  longitude: -1.3480234953335598,
  zoom: 9,
};

const TelicentMap = () => {
  const { clearSelected } = useContext(CytoscapeContext);
  const { data, onAssetSelect, selectedElements } = useContext(ElementsContext);

  const { assets, assetCriticalityColorScale, cxnCriticalityColorScale, maxAssetCriticality } = data;
  const assetFeatures = generateAssetFeatures(assets);
  
  const [cursor, setCursor] = useState("auto");
  const [hoverInfo, setHoverInfo] = useState(undefined);
  const [mapStyle, setMapStyle] = useLocalStorage("mapStyle", "dark-v10");
  const [selectedAssetCxns, setSelectedAssetCxns] = useState([]);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [selectedSegments, setSelectedSegments] = useState([]);

  useEffect(() => {
    if (IsEmpty(assets)) {
      setSelectedAssets([]);
      setSelectedAssetCxns([]);
      return;
    }

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

    if (clickedFeature) {
      const { properties } = clickedFeature;
      event.originalEvent.stopPropagation();
      const element = JSON.parse(properties.element);

      clearSelected();
      if (event.originalEvent.shiftKey) {
        onAssetSelect((prevSelected) => {
          const index = prevSelected.findIndex((prev) => prev.id === element.id);
          if (index === -1) return [...prevSelected, new Asset(element)];
          return prevSelected.filter((prev) => prev.id !== element.id);
        });
        return;
      }
      onAssetSelect([new Asset(element)])
      return;
    }
    onAssetSelect([]);
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
    <div className="relative">
      <MapProvider>
        <Map
          cursor={cursor}
          id="telicentMap"
          interactiveLayerIds={[allAssetsLayerStyle.id]}
          initialViewState={{ ...VIEWSTATE }}
          mapboxAccessToken={config.mb.token}
          mapStyle={`mapbox://styles/mapbox/${mapStyle}`}
          onClick={handleOnClick}
          onDragStart={() => setCursor("move")}
          onDragEnd={resetCursor}
          onMouseEnter={() => setCursor("pointer")}
          onMouseLeave={resetCursor}
          onMouseMove={handleOnMouseMove}
          boxZoom={false}
        >
          <Source
            id="all-assets"
            type={GEOJSON}
            data={{ type: FEATURE_COLLECTION, features: assetFeatures }}
          >
            <Layer {...allAssetsLayerStyle} />
          </Source>
          <Source
            id="selected-connections"
            type={GEOJSON}
            data={{ type: FEATURE_COLLECTION, features: selectedAssetCxns }}
          >
            <Layer {...lineStyle} />
          </Source>
          <Source
            id="selected-segments"
            type={GEOJSON}
            data={{ type: FEATURE_COLLECTION, features: selectedSegments }}
          >
            <Layer {...segmentStyle} />
          </Source>
          <Source
            id="selected-assets"
            type={GEOJSON}
            data={{ type: FEATURE_COLLECTION, features: selectedAssets }}
          >
            <Layer {...highlightedAssets} />
          </Source>
          <HoverInfo
            info={hoverInfo?.feature.properties.element}
            left={hoverInfo?.x}
            top={hoverInfo?.y}
          />
        </Map>
        <MapToolbar mapStyle={mapStyle} setMapStyle={setMapStyle} />
      </MapProvider>
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
