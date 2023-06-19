import React, { useContext, useEffect, useMemo, useState } from "react";
import Map, { Layer, Source, ScaleControl, useMap, AttributionControl } from "react-map-gl";
import { ErrorBoundary } from "react-error-boundary";

import { CytoscapeContext, ElementsContext } from "context";
import {
  useFloodAreaPolygons,
  useFloodMonitoringStations,
  useMapInteractions,
  useLocalStorage,
  useBuildingsEpcRating,
} from "hooks";
import { ErrorFallback, FloatingPanel, Modal } from "lib";

import MapToolbar from "./MapToolbar/MapToolbar";
import PointerCoordinates from "./PointerCoords";
import FloodMonitoringStations from "./FloodMonitoringStations";
import FloodWarningWidget from "./FloodAreaWidget";
import FloodZones from "./FloodZones";

import { FLOOD_AREA_LAYERS, heatmap, LINEAR_ASSET_LAYER } from "./layers";
import { generateLinearAssetFeatures } from "./map-utils";
import { getMapStyles } from "./mapStyles";

import "@fortawesome/fontawesome-pro/css/all.css";
import "./map.css";
import PointAssets from "./PointAssets";
import BuildingsEpcRating from "./BuildingsEpcRating";


export const GEOJSON = "geojson";
export const FEATURE_COLLECTION = "FeatureCollection";
const VIEWSTATE = {
  latitude: 50.66206632912732,
  longitude: -1.3480234953335598,
  zoom: 9,
};
const HEAT_RADIUS = 1000;

const TelicentMap = () => {
  const { telicentMap: map } = useMap();
  const { moveTo } = useContext(CytoscapeContext);
  const { assets, dependencies, selectedFloodAreas, selectedElements, onElementClick, onAreaSelect } =
    useContext(ElementsContext);

  const { polygonFeatures: floodAreas, isLoading: areFloodAreasLoading } = useFloodAreaPolygons(selectedFloodAreas);
  const { interactiveLayers, selectedFloodZones, handleOnClick } = useMapInteractions({
    map,
    assets,
    dependencies,
    selectedElements,
    onElementClick,
    onAreaSelect,
    moveTo,
  });
  const mapStyles = useMemo(() => getMapStyles(), []);

  const [mapStyle, setMapStyle] = useLocalStorage("mapStyle", mapStyles[0]);
  const { query, menuItem: monitoringStationLayerItem, showStations } = useFloodMonitoringStations();
  const { query: buildingsEpcQuery, menuItem: buildingsEpcLayerItem, showBuildings } = useBuildingsEpcRating();

  const [cursor, setCursor] = useState("auto");
  const [heatmapRadius, setHeatmapRadius] = useState(10);
  const [showPointerCoords, setShowPointerCoords] = useState(false);

  const [linearAssets, setLinearAssets] = useState([]);
  const [mousePosition, setMousePosition] = useState(undefined);

  // The order of the array is the order in which the features will appear in the map.
  // index 0 being the lowest level
  const sources = useMemo(
    () => [
      {
        id: "flood-areas",
        features: floodAreas,
        layers: FLOOD_AREA_LAYERS,
      },
      { id: "linear-assets", features: linearAssets, layers: [LINEAR_ASSET_LAYER] },
    ],
    [linearAssets, floodAreas]
  );

  useEffect(() => {
    const isStyleDefined = mapStyles.some((style) => style.id === mapStyle.id);
    if (!isStyleDefined) setMapStyle(mapStyles[0]);
  }, [mapStyles, mapStyle, setMapStyle]);

  useEffect(() => {
    const linearAssets = generateLinearAssetFeatures(assets, selectedElements);
    setLinearAssets(linearAssets);
  }, [assets, selectedElements]);

  const handleOnMouseMove = (event) => {
    const { lngLat } = event;
    setMousePosition(lngLat);
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
      generateId
    >
      {source.layers.map((layer) => (
        <Layer key={layer.id} {...layer} />
      ))}
    </Source>
  );

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="relative w-full">
        <Map
          cursor={cursor}
          id="telicentMap"
          interactiveLayerIds={interactiveLayers}
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
          <PointAssets
            map={map}
            assets={assets}
            dependencies={dependencies}
            selectedElements={selectedElements}
            onElementClick={onElementClick}
            moveTo={moveTo}
            onAreaSelect={onAreaSelect}
          />
          <BuildingsEpcRating map={map} query={buildingsEpcQuery} showBuildings={showBuildings} />
          <FloodMonitoringStations query={query} showStations={showStations} />
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
          <MapToolbar
            heatmapRadius={heatmapRadius}
            map={map}
            mapStyle={mapStyle}
            setMapStyle={setMapStyle}
            showPointerCoords={showPointerCoords}
            onPointerCoordsClick={togglePointerCoords}
            setCursor={setCursor}
            layerItems={[monitoringStationLayerItem, buildingsEpcLayerItem]}
          />
        </Map>
        <TopLeftPanel>
          <PointerCoordinates show={showPointerCoords} lat={mousePosition?.lat} lng={mousePosition?.lng} />
          <FloodZones selectedFloodZones={selectedFloodZones} />
        </TopLeftPanel>
        <FloodWarningWidget />
      </div>
      <Modal appElement="root" isOpen={areFloodAreasLoading} className="py-2 px-6 rounded-lg">
        <p>Adding flood areas to map</p>
      </Modal>
    </ErrorBoundary>
  );
};

export default TelicentMap;

const TopLeftPanel = ({ children }) => <FloatingPanel position="top-0 left-0">{children}</FloatingPanel>;
