import { isEmpty } from "lodash";

export const generateFeatures = (assets, dependencies, selectedElements) => {
  const pointAssets = assets
    .filter((asset) => asset.lat && asset.lng)
    .map((asset) => {
      return asset.createPointAsset(selectedElements);
    });

  const pointAssetDependencies = dependencies.map((dependency) => {
    return dependency.createLineFeature(assets, selectedElements);
  });

  const linearAssets = assets
    .filter((asset) => !isEmpty(asset.geometry))
    .map((asset) => asset.createLinearAsset(selectedElements));

  return { pointAssets, pointAssetDependencies, linearAssets };
};
