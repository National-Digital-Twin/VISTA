import { useQueries, useQuery } from "react-query";
import { fetchAssetInfo, fetchIconStyles, fetchProviders } from "api/combined";

const useProviders = (isAsset, isDependency, assetUri, provider) => {
  const {
    isLoading: isAssetProvidersLoading,
    isError,
    error,
    data: assetProviders,
  } = useQuery(["asset-providers", assetUri], () => fetchProviders(assetUri), {
    enabled: isAsset,
  });

  const providerDetailQueries = useQueries([
    ...(assetProviders || []).map((provider) => {
      const assetUri = provider?.providerNode;
      return {
        queryKey: ["provider-details", assetUri],
        queryFn: async () => {
          const providerDetails = await getProviderDetails(
            assetUri,
            provider?.providerNodeType,
            provider.criticalityRating
          );
          return providerDetails;
        },
        enabled: !!assetUri,
      };
    }),
    {
      queryKey: ["provider-details", provider?.uri],
      queryFn: async () => {
        const providerDetails = await getProviderDetails(
          provider?.uri,
          provider?.type,
          provider?.criticality
        );
        return providerDetails;
      },
      enabled: isDependency,
    },
  ]);

  const isLoading =
    isAssetProvidersLoading || providerDetailQueries.some((query) => query.isLoading);
  const data = providerDetailQueries
    .filter((query) => !query.isIdle && !query.isLoading)
    .map((query) => {
      if (query.isError) return { error: query.error };
      return query.data;
    });

  return { isLoading, isError, error, data };
};

export default useProviders;

const getProviderDetails = async (assetUri, typeUri, connectionStrength) => {
  const assetInfo = await fetchAssetInfo(assetUri);
  const iconStyle = await fetchIconStyles(typeUri);
  return {
    ...assetInfo,
    connectionStrength,
    styles: iconStyle,
  };
};
