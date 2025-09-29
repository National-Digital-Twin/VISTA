import { useQueries, useQuery } from '@tanstack/react-query';
import { fetchAssetInfo, fetchProviders } from '@/api/combined';

export default function useProviders(isAsset: boolean, isDependency: boolean, assetUri: string, provider: any) {
    const {
        isLoading: isAssetProvidersLoading,
        isError,
        error,
        data: assetProviders,
    } = useQuery({
        enabled: isAsset,
        queryKey: ['asset-providers', assetUri],
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
                if (result.isError) {
                    return { error: result.error };
                }
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
}

async function getProviderDetails(assetUri: string, connectionStrength: number) {
    const assetInfo = await fetchAssetInfo(assetUri);
    return {
        ...assetInfo,
        connectionStrength,
    };
}

function getProviderDetailQueriesConfig({
    assetProviders,
    isDependency,
    provider,
}: {
    assetProviders: any[];
    isDependency: boolean;
    provider: any;
}) {
    if (isDependency) {
        return [
            {
                queryKey: ['provider-details', provider?.uri],
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
            queryKey: ['provider-details', assetUri],
            queryFn: async () => {
                const providerDetails = await getProviderDetails(assetUri, provider.criticalityRating);
                return providerDetails;
            },
            enabled: !!assetUri,
        };
    });
}
