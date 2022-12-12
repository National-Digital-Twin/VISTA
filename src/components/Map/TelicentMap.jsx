import React, { useContext, useEffect, useMemo, useState } from "react";
import Map, { Layer, Source, ScaleControl, useMap } from "react-map-gl";
import { isEmpty } from "lodash";

import config from "config/app-config";
import { CytoscapeContext, ElementsContext } from "context";
import { useLocalStorage } from "hooks";
import { findAsset } from "utils";

import { heatmap, linearAssetsLayer, pointAssetCxnLayer, pointAssetLayer } from "./layerStyles";
import { generateFeatures } from "./mapboxFeatures";
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
  const { assets, dependencies, selectedElements, clearSelectedElements, onElementClick } =
    useContext(ElementsContext);
  const [mapStyle, setMapStyle] = useLocalStorage("mapStyle", "mapbox://styles/mapbox/dark-v10");

  const [cursor, setCursor] = useState("auto");
  const [hoverInfo, setHoverInfo] = useState(undefined);
  const [heatmapRadius, setHeatmapRadius] = useState(10);

  const [linearAssets, setLinearAssets] = useState([]);
  const [pointAssets, setPointAssets] = useState([]);
  const [pointAssetDependencies, setPointAssetDependencies] = useState([]);

  // The order of the array is the order in which the features will appear in the map.
  // index 0 being the lowest level
  const sources = useMemo(
    () => [
      { id: "heatmap", features: pointAssets, layers: [heatmap] },
      {
        id: "point-asset-dependecies",
        features: pointAssetDependencies,
        layers: [pointAssetCxnLayer],
      },
      { id: "point-assets", features: pointAssets, layers: [pointAssetLayer] },
      { id: "linear-assets", features: linearAssets, layers: [linearAssetsLayer] },
    ],
    [linearAssets, pointAssets, pointAssetDependencies]
  );

  useEffect(() => {
    if (!getMapStyles().some((style) => style.id === mapStyle)) {
      setMapStyle(getMapStyles()[0].id);
    }
  }, [mapStyle, setMapStyle]);

  useEffect(() => {
    if (isEmpty(assets) && isEmpty(selectedElements)) return;
    const { pointAssets, pointAssetDependencies, linearAssets } = generateFeatures(
      assets,
      dependencies,
      selectedElements
    );
    setPointAssets(pointAssets);
    setPointAssetDependencies(pointAssetDependencies);
    setLinearAssets(linearAssets);
  }, [assets, dependencies, selectedElements]);

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
      const element = findAsset([...assets, ...dependencies], properties.uri);
      onElementClick(event.originalEvent.shiftKey, element);
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
        interactiveLayerIds={[pointAssetLayer.id, pointAssetCxnLayer.id, linearAssetsLayer.id]}
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
        <HoverInfo info={hoverInfo?.feature.properties} left={hoverInfo?.x} top={hoverInfo?.y} />
        <MapConfig
          assets={assets}
          dependencies={dependencies}
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

  return (
    <div
      className="bg-black-50 text-whiteSmoke absolute font-body text-sm px-2 py-1 rounded-md"
      style={{ left: left + 10, top: top + 8 }}
    >
      <p>ID: {info.id}</p>
      <p>Criticality: {info.criticality}</p>
    </div>
  );
};
