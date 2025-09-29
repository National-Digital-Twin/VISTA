import { useQueries, useQuery } from '@tanstack/react-query';
import { fetchAssetInfo, fetchDependents } from '@/api/combined';

export default function useDependents(isAsset: boolean, isDependency: boolean, assetUri: string, dependent: any) {
    const {
        isLoading: isAssetDependentsLoading,
        isError,
        error,
        data: assetDependents,
    } = useQuery({
        queryKey: ['asset-dependents', assetUri],
        queryFn: () => fetchDependents(assetUri),
        enabled: isAsset,
    });

    const dependentDetailQueries = useQueries({
        queries: getDependentDetailQueriesConfig({
            assetDependents: assetDependents ?? [],
            isDependency,
            dependent,
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
        isLoading: isAssetDependentsLoading || dependentDetailQueries.isLoading,
        isError,
        error,
        data: dependentDetailQueries.data,
    };
}

async function getDependentDetails(assetUri: string, connectionStrength: number) {
    const assetInfo = await fetchAssetInfo(assetUri);
    return {
        ...assetInfo,
        connectionStrength,
    };
}

const getDependentDetailQueriesConfig = ({
    assetDependents,
    isDependency,
    dependent,
}: {
    assetDependents: any[];
    isDependency: boolean;
    dependent: any;
}) => {
    if (isDependency) {
        return [
            {
                queryKey: ['dependent-details', dependent?.uri],
                queryFn: async () => {
                    const dependentDetails = await getDependentDetails(dependent?.uri, dependent?.criticality);
                    return dependentDetails;
                },
                enabled: isDependency,
            },
        ];
    }

    return assetDependents.map((dependent) => {
        const assetUri = dependent?.dependentNode;
        return {
            queryKey: ['dependent-details', dependent?.dependentNode],
            queryFn: async () => {
                const dependentDetails = await getDependentDetails(dependent?.dependentNode, dependent?.criticalityRating);
                return dependentDetails;
            },
            enabled: !!assetUri,
        };
    });
};
