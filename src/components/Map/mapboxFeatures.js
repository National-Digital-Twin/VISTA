export const generateAssetFeatures = (assets) => {
  return assets.filter((asset) => asset.lat && asset.lng).map((asset) => asset.createPointAsset("#333"));
};

export const generateLinearAssetFeatures = (assets) => {
  return assets.flatMap((asset) => asset.createLinearAsset("#949494"));
};

export const createSelectedAssetFeatures = (
  assets,
  assetCriticalityColorScale,
  maxCriticality,
  selectedElements
) => {
  return selectedElements.flatMap((element) =>
    element.generateSelectedAssetFeatures(assets, assetCriticalityColorScale, maxCriticality)
  );
};

export const createSelectedSegmentFeatures = (selectedElements, colorScale, assets) => {
  return selectedElements.flatMap((selectedElement) =>
    selectedElement.generateSelectedSegmentFeatures(assets, colorScale)
  );
};

export const createSelectedConnectionFeatures = (
  assets,
  cxnCriticalityColorScale,
  selectedElements
) => {
  return selectedElements.flatMap((element) =>
    element.generateSelectedConnectionFeature(assets, cxnCriticalityColorScale)
  );
};
