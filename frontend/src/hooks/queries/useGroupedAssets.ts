import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  createDependencies,
  fetchAssetsForAssetSpecification,
} from "./dataset-utils";
import { Asset, Dependency } from "@/models";
import { fetchAssessmentDependencies } from "@/api/combined";
import { fetchAssetSpecifications } from "@/api/fetchAssetSpecifications";

export interface UseGroupedAssetsOptions {
  /** Assessment URI */
  assessment?: string;
  /** Text search filter */
  searchFilter?: string;
}

type DatasetState<T = any> = {
  id: string;
  category: string;
  status: "pending" | "success" | "error";
  data?: T;
  error?: unknown;
};

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

  const emptyResponseStillLoading = {
    filteredAssets: [],
    isLoadingAssets: true,
  };

  const emptyResponseFinishedLoading = {
    filteredAssets: [],
    isLoadingAssets: false,
  };

  const {
    data: assetSpecifications,
    isLoading: isLoadingAssetSpecifications,
    error: assetSpecificationError,
  } = useQuery({
    queryKey: ["assetSpecifications"],
    queryFn: () => fetchAssetSpecifications(),
  });

  const queries = useQueries({
    queries: (assetSpecifications ?? []).map((assetSpecification, index) => ({
      queryKey: ["dataset", `${assetSpecification.type}-${index}`],
      queryFn: () => fetchAssetsForAssetSpecification(assetSpecification),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const datasets = queries.map((q, i) => {
    if (assetSpecifications) {
      return {
        id: assetSpecifications[i].type,
        type: assetSpecifications[i].type,
        category: assetSpecifications[i].secondaryCategory,
        status: q.status,
        data: q.data,
        error: q.error,
      } as DatasetState;
    }
  });

  const {
    data: staticAssets,
    isLoading: staticAssetsLoading,
    error: staticAssetsError,
  } = useQuery<Asset[]>({
    queryKey: ["staticAssets"],
    queryFn: async () => {
      const assetSpecifications = (
        await import("@/data/coeff-assets-with-geometry.json")
      ).default as any[];
      return Array.from(assetSpecifications).map((asset) => new Asset(asset));
    },
  });

  const assets = useMemo(() => {
    if (staticAssetsLoading) {
      return;
    }
    const assets: Asset[] = [];
    datasets.forEach((ds) => {
      if (ds?.data) {
        assets.push(...ds.data);
      }
    });

    if (staticAssetsError || !staticAssets) {
      return assets;
    } else {
      return [...assets, ...staticAssets];
    }
  }, [datasets, staticAssets]);

  const assetsLoading = useMemo(() => {
    const allFinished = datasets.every(
      (d) => d && (d.status === "success" || d.status === "error"),
    );
    return !allFinished;
  }, [datasets]);

  const assetsError = useMemo(() => {
    return datasets.some((d) => d && d.status === "error");
  }, [datasets]);

  const total = datasets.length;
  const completed = datasets.filter(
    (d) => d && (d.status === "success" || d.status === "error"),
  ).length;
  const progress = total > 0 ? completed / total : 0;

  const {
    data: dependencies,
    isLoading: dependenciesLoading,
    error: dependenciesError,
  } = useQuery({
    queryKey: ["assets-with-dependencies", assessment ?? ""],
    enabled: !assetsLoading,
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
    console.error(dependenciesError);
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

  if (isLoadingAssetSpecifications) {
    return emptyResponseStillLoading;
  }

  if (assetSpecificationError || !assetSpecifications) {
    return emptyResponseFinishedLoading;
  }

  return {
    isLoadingDependencies: dependenciesLoading,
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
    progress,
  };
};

export default useGroupedAssets;
