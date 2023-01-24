import { Asset, Dependency } from "models";

export const createDependencies = (dependencies) => {
  if (!dependencies && !Array.isArray(dependencies)) return [];
  return dependencies.map(
    (dependency) =>
      new Dependency({
        uri: dependency.dependencyUri,
        criticality: dependency.criticalityRating,
        dependent: {
          uri: dependency.dependentNode,
          type: dependency.dependentNodeType,
        },
        provider: {
          uri: dependency.providerNode,
          type: dependency.providerNodeType,
        },
        osmID: dependency.osmID,
      })
  );
};

export const createAssets = async (assets, iconStyle, getAssetGeometry) => {
  if (!assets && !Array.isArray(assets)) return [];

  return await Promise.all(
    assets.map(async (asset) => {
      const geometry = await getAssetGeometry(asset.uri);
      return new Asset({
        uri: asset.uri,
        type: asset.type,
        lat: asset.lat,
        lng: asset.lon,
        geometry,
        dependent: {
          count: asset.dependentCount,
          criticalitySum: asset.dependentCriticalitySum,
        },
        styles: iconStyle,
      });
    })
  );
};
