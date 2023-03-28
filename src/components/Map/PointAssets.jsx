import React, { useEffect, useState } from "react";
import { Layer, Marker, Source } from "react-map-gl";
import PropTypes from "prop-types";
import classNames from "classnames";

import { findElement } from "utils";
import { FEATURE_COLLECTION, GEOJSON } from "./TelicentMap";
import { generatePointAssetFeatures } from "./map-utils";
import { pointAssetCxnLayer } from "./layers";

const PointAssets = ({ assets, dependencies, selectedElements, onElementClick, moveTo }) => {
  const [features, setFeatures] = useState([]);
  const points = features.filter((feature) => feature.geometry.type === "Point");

  useEffect(() => {
    const features = generatePointAssetFeatures(assets, dependencies, selectedElements);
    setFeatures(features);
  }, [assets, dependencies, selectedElements]);

  const handleOnAssetClick = (event, clickedFeature) => {
    const { originalEvent } = event;
    const isMultiSelect = originalEvent.shiftKey;
    originalEvent.stopPropagation();

    const connectedDependencies = features
      .filter((feature) => feature.geometry.type === "LineString")
      .filter((feature) => {
        const isDependent = feature.properties.dependent === clickedFeature.properties.uri;
        const isProvider = feature.properties.provider === clickedFeature.properties.uri;
        return isDependent || isProvider;
      });

    const connectedAssets = connectedDependencies.map((feature) => {
      const isDependent = feature.properties.dependent === clickedFeature.properties.uri;

      if (isDependent) {
        const providerAsset = points.find(
          (point) => point.properties.uri === feature.properties.provider
        );
        return providerAsset;
      }

      const dependentAsset = points.find(
        (point) => point.properties.uri === feature.properties.dependent
      );
      return dependentAsset;
    });

    const elements = [clickedFeature, ...connectedAssets, ...connectedDependencies].map((feature) =>
      findElement([...assets, ...dependencies], feature.properties.uri)
    );

    onElementClick(isMultiSelect, elements);
    moveTo({ cachedElements: selectedElements, selectedElements: elements });
  };

  const isSelected = (feature) => {
    const isSelected = selectedElements.some(
      (selectedElement) => selectedElement.uri === feature.properties.uri
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
      <Layer {...pointAssetCxnLayer} />
      <AssetIcons features={points} onAssetClick={handleOnAssetClick} isSelected={isSelected} />
    </Source>
  );
};

PointAssets.defaultProps = {
  assets: [],
  dependencies: [],
  selectedElements: [],
  onElementClick: () => {},
  moveTo: () => {},
};

PointAssets.propTypes = {
  assets: PropTypes.array,
  dependencies: PropTypes.array,
  selectedElements: PropTypes.array,
  onElementClick: PropTypes.func,
  moveTo: PropTypes.func,
};

export default PointAssets;

const AssetIcons = ({ features, isSelected, onAssetClick }) => {
  return features.map((feature) => {
    const { geometry, properties } = feature;
    return (
      <Marker
        key={properties.uri}
        id={properties.uri}
        longitude={geometry.coordinates[0]}
        latitude={geometry.coordinates[1]}
        onClick={(event) => onAssetClick(event, feature)}
        style={{
          backgroundColor: properties.backgroundColor,
          color: properties.color,
          borderColor: isSelected(feature) ? "#fff" : properties.borderColor,
          borderRadius: "9999px",
          cursor: "pointer",
          borderWidth: "2px",
        }}
      >
        {properties?.icon ? (
          <i className={classNames(properties.icon, "px-1")} />
        ) : (
          <p className="font-body p-1">{properties.iconLabel}</p>
        )}
      </Marker>
    );
  });
};
