export const generatePointAssets = (assets, selectedElements) => {
  return assets.filter((asset) => asset.lat && asset.lng).map((asset) => {
    const selected = selectedElements.find(
      (selectedElement) => selectedElement.dependent === asset.uri
    );
    return asset.createPointAsset(selected);
  });
};

export const generateLinearAssetFeatures = (assets) => {
  return assets.flatMap((asset) => asset.createLinearAsset("#949494"));
};

export const createSelectedSegmentFeatures = (selectedElements, colorScale, assets) => {
  return selectedElements.flatMap((selectedElement) =>
    selectedElement.generateSelectedSegmentFeatures(assets, colorScale)
  );
};

export const generatePointAssetDependencies = (dependencies, features) => {
  // get selected dependent uri
  // find the dependent uri, get all assets that depend on selected asset
  // find asset in point asset features
  // use this information to create line feature
}

export const createSelectedConnectionFeatures = (
  assets,
  cxnCriticalityColorScale,
  selectedElements
) => {
  return selectedElements.flatMap((element) =>
    element.generateSelectedConnectionFeature(assets, cxnCriticalityColorScale)
  );
};
