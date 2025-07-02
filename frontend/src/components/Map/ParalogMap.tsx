import {
  useContext,
  useEffect,
  useMemo,
  useState,
  lazy,
  memo,
  Suspense,
} from "react";
import type { Feature } from "geojson";
import Map, {
  Layer,
  LayerProps,
  Source,
  ScaleControl,
  useMap,
  AttributionControl,
  NavigationControl,
} from "react-map-gl/maplibre";
import { ErrorBoundary } from "react-error-boundary";

import { Box } from "@mui/material";
import { FLOOD_AREA_LAYERS, LINEAR_ASSET_LAYER } from "./layers";
import { generateLinearAssetFeatures } from "./map-utils";
import { useMapStyles } from "./mapStyles";

import "maplibre-gl/dist/maplibre-gl.css";
import "./map.css";

import ControlsOverlay from "./ControlsOverlay";

import PointerCoordinates from "./PointerCoords";
import FloodZones from "./FloodZones";
import type Tool from "@/tools/Tool";
import { useTools } from "@/tools/useTools";
import { ErrorFallback } from "@/lib";
import { useFloodMonitoringStations } from "@/hooks";
import useLocalStorage from "@/hooks/useLocalStorage";
import useMapInteractions from "@/hooks/useMapInteractions";
import { ElementsContext } from "@/context/ElementContext";
import { DrawingModeContextProvider } from "@/context/DrawingMode";
import { MapStyleContextProvider } from "@/context/MapStyle";
import { ShowPointerCoordsContextProvider } from "@/context/ShowPointerCoords";

const FloodMonitoringStations = lazy(() => import("./FloodMonitoringStations"));
const PointAssets = lazy(() => import("./PointAssets"));

export const GEOJSON = "geojson";
export const FEATURE_COLLECTION = "FeatureCollection";

const VIEWSTATE = {
  latitude: 50.68250222042783,
  longitude: -1.377721940875408,
  zoom: 10.5,
};

interface CustomMapElementsProps {
  readonly tool: Tool;
}

function CustomMapElements({ tool }: CustomMapElementsProps) {
  if (!tool.MapElements) {
    return null;
  }
  const MapElements = tool.MapElements;
  return <MapElements />;
}

function AllOverlays() {
  const tools = useTools();

  return (
    <>
      {tools("definition-order").map((tool) => {
        if (!tool.Overlay) {
          return null;
        }

        const Overlay = tool.Overlay;
        return (
          <Suspense fallback={null} key={tool.TOOL_NAME}>
            <Overlay />
          </Suspense>
        );
      })}
    </>
  );
}

const MAllOverlays = memo(AllOverlays);

function AllCustomMapElements() {
  const tools = useTools();
  return (
    <>
      {tools("map-element-order").map((tool) => (
        <Suspense fallback={null} key={tool.TOOL_NAME}>
          <CustomMapElements tool={tool} />
        </Suspense>
      ))}
    </>
  );
}

const MAllCustomMapElements = memo(AllCustomMapElements);

interface ToolSourceType {
  /** Unique ID for the source */
  id: string;
  /** Map features included in the source */
  features: Feature[];
  /** Layers in this source */
  layers: LayerProps[];
}

const generateSources = (source: ToolSourceType) => (
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

function BuiltinSources() {
  const { assets, clickedFloodAreas, selectedElements, liveFloodAreas } =
    useContext(ElementsContext);
  const floodAreas = useMemo(
    () => Object.values(clickedFloodAreas),
    [clickedFloodAreas],
  );
  const linearAssets = useMemo(
    () => generateLinearAssetFeatures(assets, selectedElements),
    [assets, selectedElements],
  );

  const sources = useMemo(() => {
    const allSources: ToolSourceType[] = [];
    // Built-in sources
    allSources.push({
      id: "flood-areas",
      features: [
        ...floodAreas.flatMap((subAreas) => subAreas),
        ...liveFloodAreas,
      ],
      layers: FLOOD_AREA_LAYERS,
    });
    allSources.push({
      id: "linear-assets",
      features: linearAssets,
      layers: [LINEAR_ASSET_LAYER],
    });
    return allSources;
  }, [linearAssets, floodAreas, liveFloodAreas]);

  return <>{sources.map(generateSources)}</>;
}

function TransformUrl(url: string) {
  let transformedUrl = url;
  const headers = {};

  if (transformedUrl.includes("api.os.uk")) {
    const urlParts = transformedUrl.split("api.os.uk");
    const routeParams = urlParts[urlParts.length - 1];
    let requestedFont = "";
    let encodedRequestedFont = "";

    // transform the from the os maps api to the transparent proxy.
    if (routeParams.startsWith("/")) {
      transformedUrl = `${window.location.origin}/transparent-proxy/os/${routeParams.substring(1)}`;
    } else {
      transformedUrl = `${window.location.origin}/transparent-proxy/os/${routeParams}`;
    }

    // pick out the request font from the path parameters, encode it and include it in the query string parameters.
    const fontMatch = /fonts\/(.*?)\//.exec(routeParams); // ✅ Use RegExp.exec()
    if (fontMatch) {
      requestedFont = fontMatch[1];
      encodedRequestedFont = encodeURIComponent(requestedFont);

      transformedUrl += `&fonts=${encodedRequestedFont}`;

      transformedUrl = transformedUrl.replace(`/${requestedFont}/`, "/");
    }

    // remove the api key query string parameter from the transformed url.
    transformedUrl = transformedUrl.replace(/\?key=[^&]+&/, "?");
  }

  return { url: transformedUrl, headers: headers };
}

const MBuiltinSources = memo(BuiltinSources);

export default function ParalogMap() {
  const { paralogMap: map } = useMap();
  const { assets, dependencies, selectedElements, onElementClick } =
    useContext(ElementsContext);
  const { interactiveLayers, selectedFloodZones, handleOnClick } =
    useMapInteractions({
      map,
      assets,
      dependencies,
      onElementClick,
    });
  const mapStyles = useMapStyles();

  const [mapStyleKey, setMapStyleKey] = useLocalStorage(
    "mapStyle",
    mapStyles[0].key,
  );
  const { query, showStations } = useFloodMonitoringStations();

  const [showPointerCoords, setShowPointerCoords] = useState(false);
  const [showBuildingLayer, setShowBuildingLayer] = useState(false);

  const [mousePosition, setMousePosition] = useState(undefined);

  const effectiveMapStyle = useMemo(() => {
    for (const mapStyle of mapStyles) {
      if (mapStyle.key === mapStyleKey) {
        return mapStyle;
      }
    }
    return mapStyles[0];
  }, [mapStyleKey, mapStyles]);

  useEffect(() => {
    if (!map) {
      return;
    }
    const theMap = map.getMap();
    theMap.on("style.load", function (event) {
      const hasEsriCachedSource = Boolean(event.style.sourceCaches["esri"]);
      setShowBuildingLayer(hasEsriCachedSource);
    });
  }, [map]);

  const handleOnMouseMove = (event) => {
    const { lngLat } = event;
    setMousePosition(lngLat);
  };

  return (
    <Box
      style={{
        // maxHeight: "100%",
        height: "100%",
        width: "100%",
        overflow: "hidden",
      }}
    >
      <MapStyleContextProvider
        mapStyleKey={mapStyleKey}
        setMapStyleKey={setMapStyleKey}
      >
        <ShowPointerCoordsContextProvider
          showPointerCoords={showPointerCoords}
          setShowPointerCoords={setShowPointerCoords}
        >
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Map
              id="paralogMap"
              interactiveLayerIds={interactiveLayers}
              initialViewState={{ ...VIEWSTATE }}
              mapStyle={effectiveMapStyle.id}
              attributionControl={false}
              onClick={handleOnClick}
              onMouseMove={handleOnMouseMove}
              boxZoom={false}
              styleDiffing
              transformRequest={function (url, _resourceType) {
                return TransformUrl(url);
              }}
            >
              <DrawingModeContextProvider>
                <ControlsOverlay />
                <MBuiltinSources />
                <MAllCustomMapElements />
                {showBuildingLayer && (
                  <Layer
                    source-layer="TopographicArea_2"
                    id="OS/TopographicArea_2/Building/1_3D"
                    type="fill-extrusion"
                    source="esri"
                    filter={["<=", "_symbol", 4]}
                    minzoom={15}
                    paint={{
                      "fill-extrusion-color": "#A19786",
                      "fill-extrusion-height": ["get", "RelHMax"],
                      "fill-extrusion-opacity": [
                        "interpolate",
                        ["linear"],
                        ["zoom"],
                        15,
                        0,
                        16,
                        0.9,
                      ],
                    }}
                  />
                )}
                <Suspense fallback={null}>
                  <PointAssets
                    assets={assets}
                    dependencies={dependencies}
                    selectedElements={selectedElements}
                    onElementClick={onElementClick}
                  />
                </Suspense>
                <Suspense fallback={null}>
                  <FloodMonitoringStations
                    query={query}
                    showStations={showStations}
                  />
                </Suspense>
                <AttributionControl compact />
                <ScaleControl
                  position="bottom-right"
                  style={{
                    backgroundColor: "#27272780",
                    color: "#F5F5F5",
                    borderColor: "#949494",
                  }}
                />
                <NavigationControl showZoom={false} showCompass={false} />
              </DrawingModeContextProvider>
            </Map>

            <MAllOverlays />

            <PointerCoordinates
              show={showPointerCoords}
              lat={mousePosition?.lat}
              lng={mousePosition?.lng}
            />
            <FloodZones selectedFloodZones={selectedFloodZones} />
          </ErrorBoundary>
        </ShowPointerCoordsContextProvider>
      </MapStyleContextProvider>
    </Box>
  );
}
