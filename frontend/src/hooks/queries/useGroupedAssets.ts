import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createDependencies } from "./dataset-utils";
import { Asset, Dependency } from "@/models";
import { fetchAssessmentDependencies } from "@/api/combined";

export interface UseGroupedAssetsOptions {
  /** Assessment URI */
  assessment?: string;
  /** Text search filter */
  searchFilter?: string;
}

const useGroupedAssets = ({
  assessment,
  searchFilter,
}: UseGroupedAssetsOptions) => {
  const searchFilterWithoutWhitespace = (searchFilter ?? "")
    .toLowerCase()
    .replace(/\s/g, "");

  const {
    data,
    isLoading: dependenciesLoading,
    error: dependenciesError,
  } = useQuery({
    queryKey: ["assets-with-dependencies", assessment ?? ""],
    queryFn: async () => {
      const rawAssets = (await import("@/data/coeff-assets-with-geometry.json"))
        .default as any[];
      const allAssets = Array.from(rawAssets).map((asset) => new Asset(asset));
      const assetTypes = allAssets
        .map((asset) => asset.type)
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
      return [allAssets, dependencies] as [Asset[], Dependency[]];
    },
  });

  if (dependenciesError) {
    console.log(dependenciesError);
  }

  const [allAssets, dependencies] = data || [[], []];

  const filteredAssets = useMemo(
    () =>
      allAssets.filter(
        (asset) =>
          asset.type.toLowerCase().includes(searchFilterWithoutWhitespace) ||
          asset.primaryCategory
            ?.toLowerCase()
            .includes(searchFilterWithoutWhitespace) ||
          asset.secondaryCategory
            ?.toLowerCase()
            .includes(searchFilterWithoutWhitespace),
      ),
    [allAssets, searchFilterWithoutWhitespace],
  );

  const getAssetsByTypes = (typeUris: string[]) => {
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
    isLoading: dependenciesLoading,
    isError: !!dependenciesError,
    dependenciesError,
    hasTypes: filteredAssets.length > 0,
    filteredAssets,
    getAssetsByTypes,
    allAssets,
    getDependentAssets,
    getDependenciesByTypes,
  };
};

export default useGroupedAssets;
