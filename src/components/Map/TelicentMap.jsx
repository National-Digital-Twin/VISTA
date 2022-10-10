import React, { useContext, useEffect, useState } from "react";
import Map, { Layer, MapProvider, Source } from "react-map-gl";
import config from "../../config/app-config";
import { ElementsContext } from "../../ElementsContext";
import useSelectNode from "../../hooks/useSelectNode";
import { IsEmpty } from "../../utils";
import { allAssetsLayerStyle, highlightedAssets, lineStyle } from "./layerStyles";
import { generateAssetFeatures } from "./mapboxFeatures";
import MapToolbar from "./MapToolbar";

const GEOJSON = "geojson";
const FEATURE_COLLECTION = "FeatureCollection";
const VIEWSTATE = {
  latitude: 50.66206632912732,
  longitude: -1.3480234953335598,
  zoom: 9,
};

const TelicentMap = ({ selectedElement }) => {
  const { elements } = useContext(ElementsContext);
  const [setSelectedNode] = useSelectNode(elements.assets, elements.connections);

  const assetFeatures = generateAssetFeatures(elements.assets);

  const [connections, setConnections] = useState([]);
  const [connectedAssets, setConnectedAssets] = useState([]);
  const [cursor, setCursor] = useState("auto");
  const [mapStyle, setMapStyle] = useState("dark-v10");
  const [hoverInfo, setHoverInfo] = useState(undefined);

  useEffect(() => {
    if (IsEmpty(selectedElement)) return;

    const { lineAssets: connections, markerAssets: assets } =
      selectedElement.generateMapboxFeatures();

    assets.forEach(asset => {
      if (asset.properties.name === selectedElement.uri) {
        asset.properties.selected = 'true'
      }
    })
    setConnectedAssets(assets);
    setConnections(connections);
  }, [selectedElement]);

  const handleOnClick = (event) => {
    const { features } = event;
    const clickedFeature = features && features[0];

    if (clickedFeature) {
      const { properties } = clickedFeature;
      setSelectedNode(properties.uri, "asset");
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
    <div className="relative h-full">
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
        >
          <Source
            id="all-assets"
            type={GEOJSON}
            data={{ type: FEATURE_COLLECTION, features: assetFeatures }}
          >
            <Layer {...allAssetsLayerStyle} />
          </Source>
          <Source
            id="connections"
            type={GEOJSON}
            data={{ type: FEATURE_COLLECTION, features: connections }}
          >
            <Layer {...lineStyle} />
          </Source>
          <Source
            id="highlighted-assets"
            type={GEOJSON}
            data={{ type: FEATURE_COLLECTION, features: connectedAssets }}
          >
            <Layer {...highlightedAssets} />
          </Source>
          <HoverInfo info={hoverInfo?.feature.properties} left={hoverInfo?.x} top={hoverInfo?.y} />
        </Map>
        <MapToolbar mapStyle={mapStyle} setMapStyle={setMapStyle} />
      </MapProvider>
    </div>
  );
};

export default TelicentMap;

const HoverInfo = ({ info, left, top }) => {
  if (!info) return null;

  return (
    <div
      className="bg-black-50 text-whiteSmoke absolute font-body text-sm px-2 py-1 rounded-md"
      style={{ left: left + 10, top: top + 8 }}
    >
      <p>ID: {info.id}</p>
      <p>Name: {info.name}</p>
      <p>Criticality: {info.criticality}</p>
    </div>
  );
};
