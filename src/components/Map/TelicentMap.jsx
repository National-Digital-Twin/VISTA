import classNames from "classnames";
import React, { useContext, useEffect, useMemo, useState } from "react";
import Map, { Layer, Source, ScaleControl, useMap, AttributionControl, Marker } from "react-map-gl";
import { ErrorBoundary } from "react-error-boundary";

import { CytoscapeContext, ElementsContext } from "context";
import { useFloodAreaPolygons, useLocalStorage } from "hooks";
import { ErrorFallback, Modal } from "lib";
import { findElement } from "utils";

import MapToolbar from "./MapToolbar/MapToolbar";
import PointerCoordinates from "./PointerCoords";
import FloodWarningWidget from "./FloodAreaWidget";

import {
  FLOOD_AREA_LAYERS,
  heatmap,
  LINEAR_ASSET_LAYER,
  pointAssetCxnLayer,
  POINT_ASSET_LAYER,
} from "./layers";
import { generateFeatures } from "./map-utils";
import { getMapStyles } from "./mapStyles";

import "@fortawesome/fontawesome-pro/css/all.css";
import "./map.css";

const GEOJSON = "geojson";
const FEATURE_COLLECTION = "FeatureCollection";
const VIEWSTATE = {
  latitude: 50.66206632912732,
  longitude: -1.3480234953335598,
  zoom: 9,
};
const HEAT_RADIUS = 1000;
const ICON_SIZE = 14;

const TelicentMap = () => {
  const { telicentMap: map } = useMap();
  const { fit, moveTo } = useContext(CytoscapeContext);
  const {
    assets,
    dependencies,
    selectedFloodAreas,
    selectedElements,
    clearSelectedElements,
    onElementClick,
  } = useContext(ElementsContext);

  const { polygonFeatures: floodAreas, isLoading: areFloodAreasLoading } =
    useFloodAreaPolygons(selectedFloodAreas);
  const mapStyles = useMemo(() => getMapStyles(), []);
  const [mapStyle, setMapStyle] = useLocalStorage("mapStyle", mapStyles[0]);

  const [cursor, setCursor] = useState("auto");
  const [hoverInfo, setHoverInfo] = useState(undefined);
  const [heatmapRadius, setHeatmapRadius] = useState(10);
  const [iconSize, setIconSize] = useState(ICON_SIZE);
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
        id: "flood-areas",
        features: floodAreas,
        layers: FLOOD_AREA_LAYERS,
      },
      {
        id: "point-asset-dependecies",
        features: pointAssetDependencies,
        layers: [pointAssetCxnLayer],
      },
      { id: "linear-assets", features: linearAssets, layers: [LINEAR_ASSET_LAYER] },
      { id: "point-assets", features: pointAssets, layers: [POINT_ASSET_LAYER] },
    ],
    [linearAssets, pointAssets, pointAssetDependencies, floodAreas]
  );

  useEffect(() => {
    const isStyleDefined = mapStyles.some((style) => style.id === mapStyle.id);
    if (!isStyleDefined) setMapStyle(mapStyles[0]);
  }, [mapStyles, mapStyle, setMapStyle]);

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

    if (!clickedFeature && drawControl.getMode() === "simple_select") {
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
    const { _pixelPerMeter } = event.target.transform;
    let radius = HEAT_RADIUS * _pixelPerMeter;
    if (radius < 1) radius = 1;
    map.getMap().setPaintProperty(heatmap.id, "heatmap-radius", radius);
    setHeatmapRadius(radius);

    const { zoom } = event.viewState;
    let iconSize = (4 + (zoom - 5) * 2).toFixed(0);
    setIconSize(iconSize);
    if (iconSize >= ICON_SIZE) setIconSize(ICON_SIZE);
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
  );

  const generatePointAssetIcons = ({ geometry, properties }) => (
    <Marker
      key={properties.uri}
      longitude={geometry.coordinates[0]}
      latitude={geometry.coordinates[1]}
      anchor="bottom"
      color="#c4c4c4"
    >
      {properties?.icon ? (
        <i
          className={classNames(properties.icon, "marker-icon")}
          style={{ fontSize: `${iconSize}px` }}
        />
      ) : (
        <p className="marker-icon font-body" style={{ fontSize: `${iconSize}px` }}>
          {properties.iconLabel}
        </p>
      )}
    </Marker>
  );

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="relative w-full">
        <Map
          cursor={cursor}
          id="telicentMap"
          interactiveLayerIds={[POINT_ASSET_LAYER.id, pointAssetCxnLayer.id, LINEAR_ASSET_LAYER.id]}
          initialViewState={{ ...VIEWSTATE }}
          mapboxAccessToken="MapboxToken"
          mapStyle={mapStyle.id}
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
            setCursor={setCursor}
          />
        </Map>
        <FloodWarningWidget />
      </div>
      <Modal appElement="root" isOpen={areFloodAreasLoading} className="py-2 px-6 rounded-lg">
        <p>Adding flood areas to map</p>
      </Modal>
    </ErrorBoundary>
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
