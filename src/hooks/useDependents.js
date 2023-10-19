import { useQueries, useQuery } from "react-query";
import { fetchAssetInfo, fetchDependents, fetchIconStyles } from "endpoints";

const useDependents = (isAsset, isDependency, assetUri, dependent) => {
  const {
    isLoading: isAssetDependentsLoading,
    isError,
    error,
    data: assetDependents,
  } = useQuery(["asset-dependents", assetUri], () => fetchDependents(assetUri), {
    enabled: isAsset,
  });


  const dependetDetailQueries = useQueries([
    ...(assetDependents || []).map((dependent) => {
      const assetUri = dependent?.dependentNode;
      return {
        queryKey: ["dependent-details", assetUri],
        queryFn: async () => {
          const dependentDetails = await getDependentDetails(
            assetUri,
            dependent?.dependentNodeType,
            dependent?.criticalityRating
          );
          return dependentDetails;
        },
        enabled: !!assetUri,
      };
    }),
    {
      queryKey: ["dependent-details", dependent?.uri],
      queryFn: async () => {
        const dependentDetails = await getDependentDetails(
          dependent?.uri,
          dependent?.type,
          dependent?.criticality
        );
        return dependentDetails;
      },
      enabled: isDependency,
    },
  ]);

  const isLoading =
    isAssetDependentsLoading || dependetDetailQueries.some((query) => query.isLoading);
  const data = dependetDetailQueries
    .filter((query) => !query.isIdle && !query.isLoading)
    .map((query) => {
      if (query.isError) return { error: query.error };
      return query.data;
    });

  return { isLoading, isError, error, data };
};

export default useDependents;

const getDependentDetails = async (assetUri, assetType, connectionStrength) => {
  const assetInfo = await fetchAssetInfo(assetUri);
  const iconStyle = await fetchIconStyles(assetType);
  return {
    ...assetInfo,
    connectionStrength,
    styles: iconStyle,
  };
};
