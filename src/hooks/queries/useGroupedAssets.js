import { useQueries, useQuery } from "@tanstack/react-query";

import { fetchAssetTypes, fetchTypeSuperclass } from "api/combined";
import { isEmpty } from "lodash";

/**
 * This hook fetches all types in an assessment, finds each type superclass
 * (parent) and combines the data so it can be used to create a hierarchy tree
 * list
 */
const useGroupedAssets = ({ assessment, searchFilter }) => {
  const searchFilterWithoutWhitespace = searchFilter.toLowerCase().replace(" ", "");

  const assetsQuery = useQuery({
    queryKey: ["assets", assessment],
    queryFn: () => fetchAssetTypes(assessment),
  });

  const assets = assetsQuery.data ?? [];

  const assetsWithSuperclassQuery = useQueries({
    queries: assets.map((asset) => ({
      enabled: Boolean(assets),
      queryKey: ["assets", "superclass", asset.uri],
      queryFn: () => fetchTypeSuperclass(asset.uri),
      select: (superClass) => ({
        ...asset,
        superClass: superClass[asset.uri]?.superClass[0] ?? "other",
      }),
    })),
    combine: (results) => ({
      data: results.map((result) => result.data),
      isLoading: results.some((result) => result.isLoading),
    }),
  });

  const assetWithSuperClass = assetsWithSuperclassQuery.data;

  const getAssetsInSuperclassGroup = (group) => {
    return assetWithSuperClass.filter((type) => type.superClass === group);
  };

  const doesIncludeSearchFilterChars = (assetType) => {
    return assetType.uri.toLowerCase().includes(searchFilterWithoutWhitespace);
  };

  const getSuperclassGroups = () => {
    const uniqueGroups = [...new Set(assetWithSuperClass.map((type) => type?.superClass))];

    if (!searchFilter) return uniqueGroups;

    return uniqueGroups.filter(
      (group) =>
        getAssetsInSuperclassGroup(group).filter(doesIncludeSearchFilterChars).length >= 1 ||
        group.toLowerCase().includes(searchFilterWithoutWhitespace)
    );
  };

  const getSuperclassChildren = (selectedGroup) => {
    const superclassGroup = getAssetsInSuperclassGroup(selectedGroup);

    if (selectedGroup.toLowerCase().includes(searchFilter)) return superclassGroup;

    return superclassGroup.filter(doesIncludeSearchFilterChars);
  };

  return {
    isLoading: assetsQuery.isLoading || assetsWithSuperclassQuery.isLoading,
    isError: assetsQuery.isError,
    error: assetsQuery.error,
    hasTypes: !isEmpty(assetsQuery.data),
    getSuperclassGroups,
    getSuperclassChildren,
  };
};

export default useGroupedAssets;
