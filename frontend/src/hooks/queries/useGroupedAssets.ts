import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createAssets, createDependencies } from "./dataset-utils";
import { Asset, Dependency } from "@/models";
import { fetchAssessmentDependencies } from "@/api/combined";

export interface UseGroupedAssetsOptions {
  /** Assessment URI */
  assessment?: string;
  /** Text search filter */
  searchFilter?: string;
}

/**
 * Fetches assets and dependencies.
 */
const useGroupedAssets = ({
  assessment,
  searchFilter,
}: UseGroupedAssetsOptions) => {
  const searchFilterWithoutWhitespace = (searchFilter ?? "")
    .toLowerCase()
    .replace(/\s/g, "");

  const {
    data: assets,
    isLoading: assetsLoading,
    error: assetsError,
  } = useQuery<Asset[]>({
    queryKey: ["assets"],
    queryFn: async () => {
      const assetSpecifications = (
        await import("@/data/coeff-assets-with-geometry.json")
      ).default as any[];
      const staticAssets = Array.from(assetSpecifications).map(
        (asset) => new Asset(asset),
      );
      const liveAssets = await createAssets();
      return [...staticAssets, ...liveAssets];
    },
  });

  const { data: dependencies, error: dependenciesError } = useQuery({
    queryKey: ["assets-with-dependencies", assessment ?? ""],
    enabled: !!assets,
    queryFn: async () => {
      if (!assets) {
        return;
      }
      const assetTypes = assets
        .map((asset: { type: any }) => asset.type)
        .filter((value, index, self) => self.indexOf(value) === index);
      let dependencies: Dependency[];
      if (assetTypes.length > 0) {
        const dependencyData = await fetchAssessmentDependencies(
          assetTypes,
          assessment,
        );
        dependencies = createDependencies(dependencyData);
      } else {
        dependencies = [];
      }
      return dependencies;
    },
  });

  if (dependenciesError) {
    console.log(dependenciesError);
  }

  const filteredAssets = useMemo(() => {
    if (!assets) {
      return [];
    }

    return assets.filter(
      (asset) =>
        asset.type.toLowerCase().includes(searchFilterWithoutWhitespace) ||
        asset.primaryCategory
          ?.toLowerCase()
          .includes(searchFilterWithoutWhitespace) ||
        asset.secondaryCategory
          ?.toLowerCase()
          .includes(searchFilterWithoutWhitespace),
    );
  }, [assets, searchFilterWithoutWhitespace]);

  const getAssetsByTypes = (typeUris: string[]) => {
    if (!filteredAssets) {
      return [];
    }
    return filteredAssets.filter((asset) =>
      typeUris.some((uri) => uri === asset.type),
    );
  };
  const getDependenciesByTypes = (typeUris: string[]) => {
    if (!dependencies) {
      return [];
    }
    return dependencies.filter(
      (dependency) =>
        typeUris.some((uri) => uri === dependency.provider.type) &&
        typeUris.some((uri) => uri === dependency.dependent.type),
    );
  };

  const getDependentAssets = (assets: Asset[]) => {
    if (!dependencies || !filteredAssets) {
      return [];
    }
    const providerUris = new Set(assets.map((asset) => asset.uri));
    const filteredDependencies =
      dependencies?.filter(({ provider }) => providerUris.has(provider.uri)) ||
      [];
    const dependentUris = new Set(
      filteredDependencies.map(({ dependent }) => dependent.uri),
    );
    return {
      dependencies: filteredDependencies,
      dependentAssets: filteredAssets.filter(({ uri }) =>
        dependentUris.has(uri),
      ),
    };
  };

  return {
    isLoadingDependencies: assetsLoading,
    isDependenciesError: !!dependenciesError,
    isLoadingAssets: assetsLoading,
    isAssetsError: !!assetsError,
    dependenciesError,
    hasTypes: filteredAssets && filteredAssets.length > 0,
    filteredAssets,
    getAssetsByTypes,
    assets,
    getDependentAssets,
    getDependenciesByTypes,
  };
};

export default useGroupedAssets;
