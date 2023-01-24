import classNames from "classnames";
import React, { useContext, useEffect, useMemo, useState } from "react";
import Map, { Layer, Source, ScaleControl, useMap, AttributionControl, Marker } from "react-map-gl";
import { isEmpty } from "lodash";

import config from "config/app-config";
import { CytoscapeContext, ElementsContext } from "context";
import { useLocalStorage } from "hooks";
import { findElement } from "utils";

import MapToolbar from "./MapToolbar/MapToolbar";
import PointerCoordinates from "./PointerCoords";

import { heatmap, linearAssetsLayer, pointAssetCxnLayer, pointAssetLayer } from "./layerStyles";
import { generateFeatures } from "./map-utils";
import { getMapStyles } from "./mapStyles";

import "@fortawesome/fontawesome-pro/css/all.css";
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
  const { fit, moveTo } = useContext(CytoscapeContext);
  const { assets, dependencies, selectedElements, clearSelectedElements, onElementClick } =
    useContext(ElementsContext);
  const [mapStyle, setMapStyle] = useLocalStorage("mapStyle", "mapbox://styles/mapbox/dark-v10");

  const [cursor, setCursor] = useState("auto");
  const [hoverInfo, setHoverInfo] = useState(undefined);
  const [heatmapRadius, setHeatmapRadius] = useState(10);
  const [iconSize, setIconSize] = useState(12);
  const [showPointerCoords, setShowPointerCoords] = useState(false);

  const [linearAssets, setLinearAssets] = useState([]);
  const [pointAssets, setPointAssets] = useState([]);
  const [pointAssetDependencies, setPointAssetDependencies] = useState([]);
  const [mousePosition, setMousePosition] = useState(undefined);

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
      { id: "linear-assets", features: linearAssets, layers: [linearAssetsLayer] },
      { id: "point-assets", features: pointAssets, layers: [pointAssetLayer] },
    ],
    [linearAssets, pointAssets, pointAssetDependencies]
  );

  useEffect(() => {
    if (!getMapStyles().some((style) => style.id === mapStyle)) {
      setMapStyle(getMapStyles()[0].id);
    }
  }, [mapStyle, setMapStyle]);

  useEffect(() => {
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

    const controls = event.target._controls;
    const drawControl = Object.values(controls).find((item) => item.modes);
    const selectedPolygons = drawControl.getSelected().features;

    if (!clickedFeature && isEmpty(selectedPolygons)) {
      clearSelectedElements();
      fit();
      return;
    }

    if (clickedFeature?.type === "Feature") {
      const { properties } = clickedFeature;
      event.originalEvent.stopPropagation();

      const multiSelect = event.originalEvent.shiftKey;
      const element = findElement([...assets, ...dependencies], properties.uri);

      onElementClick(multiSelect, element);
      moveTo({ multiSelect, cachedElements: selectedElements, selectedElement: element });
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
    setMousePosition(event.lngLat);
  };

  const resetCursor = () => {
    setCursor("auto");
  };

  const handleOnZoom = (event) => {
    const { pixelsPerMeter } = event.target.transform;
    const { zoom } = event.viewState;
    let radius = HEAT_RADIUS * pixelsPerMeter;
    if (radius < 1) radius = 1;
    map.getMap().setPaintProperty(heatmap.id, "heatmap-radius", radius);
    setHeatmapRadius(radius);

    let iconSize = (4 + (zoom - 5) * 2).toFixed(0);
    setIconSize(iconSize);
    if (iconSize >= 16) setIconSize(14);
  };

  const togglePointerCoords = () => {
    setShowPointerCoords((prev) => !prev);
  };

  const generateSources = (source) => (
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
  )

  const generatePointAssetIcons = ({ geometry, properties }) => (
    <Marker
      key={properties.id}
      longitude={geometry.coordinates[0]}
      latitude={geometry.coordinates[1]}
      anchor="bottom"
      color="#c4c4c4"
    >
      {properties?.icon && (
        <i
          className={classNames(properties.icon, "marker-icon")}
          style={{ fontSize: `${iconSize}px` }}
        />
      )}
      {properties?.iconLabel && <p className="marker-icon">{properties.iconLabel}</p>}
    </Marker>
  );

  return (
    <div className="relative w-full">
      <Map
        cursor={cursor}
        id="telicentMap"
        interactiveLayerIds={[pointAssetLayer.id, pointAssetCxnLayer.id, linearAssetsLayer.id]}
        initialViewState={{ ...VIEWSTATE }}
        mapboxAccessToken={config.mb.token}
        mapStyle={mapStyle}
        attributionControl={false}
        onClick={handleOnClick}
        onDragStart={() => setCursor("move")}
        onDragEnd={resetCursor}
        onMouseEnter={() => setCursor("pointer")}
        onMouseLeave={resetCursor}
        onMouseMove={handleOnMouseMove}
        boxZoom={false}
        onZoom={handleOnZoom}
        styleDiffing
      >
        {sources.map(generateSources)}
        {pointAssets.map(generatePointAssetIcons)}
        <AttributionControl compact />
        <ScaleControl
          position="bottom-right"
          style={{
            position: "relative",
            backgroundColor: "#27272780",
            color: "#F5F5F5",
            borderColor: "#949494",
            fontFamily: "Urbanist",
            letterSpacing: "1.5px",
            margin: 0,
            height: "22px",
          }}
        />
        <HoverInfo info={hoverInfo?.feature.properties} left={hoverInfo?.x} top={hoverInfo?.y} />
        <PointerCoordinates
          show={showPointerCoords}
          lat={mousePosition?.lat}
          lng={mousePosition?.lng}
        />
        <MapToolbar
          heatmapRadius={heatmapRadius}
          map={map}
          mapStyle={mapStyle}
          setMapStyle={setMapStyle}
          showPointerCoords={showPointerCoords}
          onPointerCoordsClick={togglePointerCoords}
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
