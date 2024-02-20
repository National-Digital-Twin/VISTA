import { useQueries, useQuery } from "@tanstack/react-query";
import { fetchAssetInfo, fetchProviders } from "api/combined";

const useProviders = (isAsset, isDependency, assetUri, provider) => {
  const {
    isLoading: isAssetProvidersLoading,
    isError,
    error,
    data: assetProviders,
  } = useQuery({
    enabled: isAsset,
    queryKey: ["asset-providers", assetUri],
    queryFn: () => fetchProviders(assetUri),
  });

  const providerDetailQueries = useQueries({
    queries: getProviderDetailQueriesConfig({
      assetProviders: assetProviders ?? [],
      isDependency,
      provider,
    }),
    combine: (results) => ({
      data: results.map((result) => {
        if (result.isError) return { error: result.error };
        return result.data;
      }),
      isLoading: results.some((result) => result.isLoading),
    }),
  });

  return {
    isLoading: isAssetProvidersLoading || providerDetailQueries.isLoading,
    isError,
    error,
    data: providerDetailQueries.data,
  };
};

export default useProviders;

const getProviderDetails = async (assetUri, connectionStrength) => {
  const assetInfo = await fetchAssetInfo(assetUri);
  return {
    ...assetInfo,
    connectionStrength,
  };
};

const getProviderDetailQueriesConfig = ({ assetProviders, isDependency, provider }) => {
  if (isDependency) {
    return [
      {
        queryKey: ["provider-details", provider?.uri],
        queryFn: async () => {
          const providerDetails = await getProviderDetails(provider?.uri, provider?.criticality);
          return providerDetails;
        },
        enabled: isDependency,
      },
    ];
  }

  return assetProviders.map((provider) => {
    const assetUri = provider?.providerNode;
    return {
      queryKey: ["provider-details", assetUri],
      queryFn: async () => {
        const providerDetails = await getProviderDetails(assetUri, provider.criticalityRating);
        return providerDetails;
      },
      enabled: !!assetUri,
    };
  });
};
