import React, { useEffect, useState } from "react";
import Map, { Layer, Source } from "react-map-gl";
import config from "../../config/app-config";
import { getMapStyles } from "./mapStyles";
import { allAssetsLayerStyle, highlightedAssets, lineStyle, segmentStyle } from "./layerStyles";

const GEOJSON = "geojson";
const FEATURE_COLLECTION = "FeatureCollection";
const VIEWSTATE = {
  latitude: 50.66206632912732,
  longitude: -1.3480234953335598,
  zoom: 9,
};

const MapboxMap = ({
  allAssets,
  selectedAssets,
  selectedSegments,
  selectedCxns,
  mapStyle,
  setMapStyle,
  onClick,
}) => {
  const [cursor, setCursor] = useState("auto");
  const [hoverInfo, setHoverInfo] = useState(undefined);

  useEffect(() => {
    if (!getMapStyles().some((style) => style.id === mapStyle)) {
      setMapStyle(getMapStyles()[0].id);
    }
  }, [mapStyle, setMapStyle]);

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
    <Map
      cursor={cursor}
      id="telicentMap"
      interactiveLayerIds={[allAssetsLayerStyle.id]}
      initialViewState={{ ...VIEWSTATE }}
      mapboxAccessToken={config.mb.token}
      mapStyle={mapStyle}
      onClick={onClick}
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
        data={{ type: FEATURE_COLLECTION, features: allAssets }}
      >
        <Layer {...allAssetsLayerStyle} />
      </Source>
      <Source
        id="selected-connections"
        type={GEOJSON}
        data={{ type: FEATURE_COLLECTION, features: selectedCxns }}
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
  );
};
export default MapboxMap;

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
