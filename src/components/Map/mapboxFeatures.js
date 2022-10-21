export const generateAssetFeatures = (assets) => {
  return assets.map((asset) => asset.createMapAsset());
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
  const cxns = selectedElements.flatMap((element) =>
    element.generateSelectedConnectionFeature(assets, cxnCriticalityColorScale)
  );
  console.log("cxns", cxns);
  return cxns;
};
