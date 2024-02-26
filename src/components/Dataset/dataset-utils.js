import { Asset, Dependency } from "models";

export const createDependencies = (dependencies) => {
  if (!dependencies && !Array.isArray(dependencies)) return [];
  return dependencies.map(
    (dependency) =>
      new Dependency({
        uri: dependency.dependencyUri,
        criticality: dependency?.criticalityRating || 0,
        dependent: {
          uri: dependency.dependentNode,
          name: dependency.dependentName,
          type: dependency.dependentNodeType,
        },
        provider: {
          uri: dependency.providerNode,
          name: dependency.providerName,
          type: dependency.providerNodeType,
        },
        osmID: dependency.osmID,
      })
  );
};

const hasParts = (asset) => asset?.partCount > 0;

export const createAssets = async (assets, findIcon, getAssetGeometry) => {
  if (!assets && !Array.isArray(assets)) return [];

  return await Promise.all(
    assets.map(async (asset) => {
      const uri = asset?.uri;
      const type = asset?.type;
      const geometry = hasParts(asset) ? await getAssetGeometry(asset.uri) : [];
      return new Asset({
        uri,
        type,
        lat: asset?.lat,
        lng: asset?.lon,
        geometry,
        dependent: {
          count: asset?.dependentCount || 0,
          criticalitySum: asset?.dependentCriticalitySum || 0,
        },
        styles: findIcon(type),
      });
    })
  );
};
