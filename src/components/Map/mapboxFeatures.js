export const generateAssetFeatures = (assets) => {
  return assets.map((asset) => asset.createMapAsset());
};

export const createSelectedAssetFeatures = (
  assets,
  assetCriticalityColorScale,
  maxCriticality,
  selectedElements
) => {
  return selectedElements.flatMap((element) => {
    const colorScale = assetCriticalityColorScale;
    return element.generateSelectedAssetFeatures(assets, colorScale, maxCriticality);
  });
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
  const colorScale = cxnCriticalityColorScale;
  return selectedElements.flatMap((element) =>
    element.generateSelectedConnectionFeature(assets, colorScale)
  );
};
