import { useEffect, useMemo, useCallback } from "react";
import { Layer, Marker, Source, useMap } from "react-map-gl/maplibre";
import type { MapboxGeoJSONFeature } from "react-map-gl";
import type { Feature } from "geojson";
import classNames from "classnames";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icon, IconName } from "@fortawesome/fontawesome-svg-core";
import { FEATURE_COLLECTION, GEOJSON } from "./ParalogMap";
import { generatePointAssetFeatures } from "./map-utils";
import { FLOOD_AREA_LAYERS, heatmap, pointAssetCxnLayer } from "./layers";

import InfoTooltip from "./InfoTooltip";

import styles from "./PointAssets.module.css";
import { CpsAssetIcon } from "./CpsAssetIcon";
import useFindIcon from "@/hooks/useFindIcon";
import { findElement } from "@/utils";
import type { Asset, Dependency, Element } from "@/models";
import useSharedStore from "@/hooks/useSharedStore";
import useTrainStore from "@/tools/Train/useStore";
import TRAIN_STATIONS from "@/data/train-stations.json";

export interface PointAssetsProps {
  /** List of all point assets */
  assets?: Asset[];
  /** List of dependencies between any point assets */
  dependencies?: Dependency[];
  /** Those elements currently selected */
  selectedElements?: Element[];
  /** Callback when an element is clicked */
  onElementClick?: (isMultiSelect: boolean, elements: Element[]) => void;
}

export default function PointAssets({
  assets = [],
  dependencies = [],
  selectedElements = [],
  onElementClick,
}: PointAssetsProps) {
  const features: Feature[] = useMemo(
    () => generatePointAssetFeatures(assets, dependencies, selectedElements),
    [assets, dependencies, selectedElements],
  );
  const points = features.filter(
    (feature) => feature.geometry.type === "Point",
  );

  const { paralogMap: map } = useMap();

  useEffect(() => {
    if (!map) {
      return;
    }

    const onLoad = () => {
      map.getMap().moveLayer(heatmap.id, FLOOD_AREA_LAYERS[0].id);
    };

    map.on("load", onLoad);

    return () => {
      map.off("load", onLoad);
    };
  }, [map]);

  const handleOnAssetClick = (event, clickedFeature) => {
    const { originalEvent } = event;
    const isMultiSelect = originalEvent.shiftKey;
    originalEvent.stopPropagation();

    const connectedDependencies = features
      .filter((feature) => feature.geometry.type === "LineString")
      .filter((feature) => {
        const isDependent =
          feature.properties.dependent === clickedFeature.properties.uri;
        const isProvider =
          feature.properties.provider === clickedFeature.properties.uri;
        return isDependent || isProvider;
      });

    const connectedAssets = connectedDependencies.map((feature) => {
      const isDependent =
        feature.properties.dependent === clickedFeature.properties.uri;

      if (isDependent) {
        const providerAsset = points.find(
          (point) => point.properties.uri === feature.properties.provider,
        );
        return providerAsset;
      }

      const dependentAsset = points.find(
        (point) => point.properties.uri === feature.properties.dependent,
      );
      return dependentAsset;
    });

    const elements = [
      clickedFeature,
      ...connectedAssets,
      ...connectedDependencies,
    ].map((feature) =>
      findElement([...assets, ...dependencies], feature.properties.uri),
    );

    onElementClick(isMultiSelect, elements);
  };

  const isSelected = (feature: MapboxGeoJSONFeature) => {
    const isSelected = selectedElements.some(
      (selectedElement) => selectedElement.uri === feature.properties.uri,
    );
    return isSelected;
  };

  return (
    <Source
      id="point-assets"
      type={GEOJSON}
      data={{ type: FEATURE_COLLECTION, features }}
      generateId
    >
      <Layer {...heatmap} />
      <Layer {...pointAssetCxnLayer} />
      <AssetIcons
        features={points}
        onAssetClick={handleOnAssetClick}
        isSelected={isSelected}
        assets={assets}
        dependencies={dependencies}
      />
    </Source>
  );
}

// The "asset click" marker event is a type with parameters spanning a few libraries;
// it would be good to make it precise but for now we're going with an imprecise type.
type AssetClickEvent = any;

interface MarkerWithTooltipProps {
  feature: Feature;
  isSelected: boolean;
  onAssetClick: (event: AssetClickEvent, clickedFeature: Feature) => void;
  assets: Asset[];
  dependencies: Dependency[];
}

function MarkerWithTooltip({
  feature,
  isSelected,
  onAssetClick,
  assets,
  dependencies,
}: MarkerWithTooltipProps) {
  const { showCpsIconsForAssetTypes } = useSharedStore();
  const selectTrainStation = useTrainStore((state) => state.selectTrainStation);
  const featureType = feature.properties.type;
  const iconStyles = useFindIcon(featureType);

  const featureURI = feature.properties.uri;

  const element = useMemo(
    () => findElement([...assets, ...dependencies], featureURI),
    [assets, dependencies, featureURI],
  );

  const [longitude, latitude] = (feature.geometry as any).coordinates;

  const onClick = useCallback(
    (event: AssetClickEvent) => {
      onAssetClick(event, feature);

      // Check if the clicked asset is a train station
      const isTrainStation =
        featureType === "http://ies.data.gov.uk/ontology/ies4#RailwayStation";
      if (isTrainStation) {
        // Find the corresponding train station name
        const stationName = Object.entries(TRAIN_STATIONS).find(
          ([_, station]) =>
            Number(parseFloat(station.latitude).toFixed(2)) ===
              Number(latitude.toFixed(2)) &&
            Number(parseFloat(station.longitude).toFixed(2)) ===
              Number(longitude.toFixed(2)),
        )?.[0];

        if (stationName) {
          selectTrainStation(stationName);
        }
      }
    },
    [
      onAssetClick,
      feature,
      featureType,
      latitude,
      longitude,
      selectTrainStation,
    ],
  );

  const fontAwesomeIconName = iconStyles.faIcon
    ?.split(" ")
    .pop()
    ?.replace("fa-", "") as IconName | undefined;

  const hasAvailableFontAwesomeIcon = !!icon({
    prefix: "fas",
    iconName: fontAwesomeIconName,
  });

  return (
    <Marker
      key={featureURI}
      longitude={longitude}
      latitude={latitude}
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      <div className={styles.markerWithTooltipContent}>
        <div className={styles.tooltip}>
          <InfoTooltip element={element} />
        </div>
        {showCpsIconsForAssetTypes ? (
          <CpsAssetIcon className={styles.cpsAssetIcon}>
            {iconStyles.iconFallbackText}
          </CpsAssetIcon>
        ) : (
          <div
            className={classNames(styles.icon, {
              [styles.isSelected]: isSelected,
            })}
            style={{
              backgroundColor: iconStyles.backgroundColor,
              color: iconStyles.color,
            }}
          >
            {hasAvailableFontAwesomeIcon ? (
              <FontAwesomeIcon icon={["fas", fontAwesomeIconName]} />
            ) : (
              <p className="p-1 font-body">{iconStyles.iconFallbackText}</p>
            )}
          </div>
        )}
      </div>
    </Marker>
  );
}

interface AssetIconsProps {
  features: Feature[];
  isSelected: (feature: Feature) => boolean;
  onAssetClick: (event: AssetClickEvent, clickedFeature: Feature) => void;
  assets: Asset[];
  dependencies: Dependency[];
}

function AssetIcons({
  features,
  isSelected,
  onAssetClick,
  assets,
  dependencies,
}: AssetIconsProps) {
  return (
    <>
      {features.map((feature) => {
        const { properties } = feature;
        return (
          <MarkerWithTooltip
            assets={assets}
            dependencies={dependencies}
            feature={feature}
            isSelected={isSelected(feature)}
            onAssetClick={onAssetClick}
            key={properties.uri}
          />
        );
      })}
    </>
  );
}
