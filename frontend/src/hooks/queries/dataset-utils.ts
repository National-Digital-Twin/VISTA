import { Asset, Dependency } from "@/models";
import type { FoundIcon } from "@/hooks/useFindIcon";
import type { AssetGeometryNode } from "@/models/Asset";

interface DependencyData {
  dependencyUri: string;
  criticalityRating?: number;
  dependentNode: string;
  dependentName: string;
  dependentNodeType: string;
  providerNode: string;
  providerName: string;
  providerNodeType: string;
  osmID: string;
}

export function createDependencies(dependencies: DependencyData[]) {
  if (!dependencies && !Array.isArray(dependencies)) {
    return [];
  }
  return dependencies.map(
    (dependency) =>
      new Dependency({
        uri: dependency.dependencyUri,
        criticality: dependency?.criticalityRating ?? 0,
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
      }),
  );
}

interface AssetData {
  uri: string;
  type: string;
  partCount: number;
  lat: number;
  lon: number;
  dependentCount: number;
  dependentCriticalitySum: number;
}

function hasParts(asset: AssetData) {
  return asset?.partCount > 0;
}

export async function createAssets(
  assets: AssetData[],
  findIcon: (type: string) => FoundIcon,
  getAssetGeometry: (uri: string) => Promise<AssetGeometryNode[]>,
) {
  if (!assets && !Array.isArray(assets)) {
    return [];
  }

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
    }),
  );
}
