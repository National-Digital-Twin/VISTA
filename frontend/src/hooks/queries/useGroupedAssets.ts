import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { createDependencies, fetchAssetsForAssetSpecification } from './dataset-utils';
import { Asset, Dependency } from '@/models';
import { fetchAssessmentDependencies } from '@/api/combined';
import { fetchAssetSpecifications } from '@/api/fetchAssetSpecifications';

export interface UseGroupedAssetsOptions {
    /** Assessment URI */
    assessment?: string;
    /** Text search filter */
    searchFilter?: string;
}

type DatasetState<T = any> = {
    id: string;
    category: string;
    status: 'pending' | 'success' | 'error';
    data?: T;
    error?: unknown;
};

/**
 * Fetches assets and dependencies.
 */
const useGroupedAssets = ({ assessment, searchFilter }: UseGroupedAssetsOptions) => {
    const searchFilterWithoutWhitespace = (searchFilter ?? '').toLowerCase().replaceAll(/\s/g, '');

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
        queryKey: ['assetSpecifications'],
        queryFn: () => fetchAssetSpecifications(),
    });

    const fetchAssetsWithTimeout = async (assetSpecification: any) => {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Query timeout')), 30000);
        });

        const fetchPromise = fetchAssetsForAssetSpecification(assetSpecification)
            .then((result) => result)
            .catch((_error) => []);

        try {
            return await Promise.race([fetchPromise, timeoutPromise]);
        } catch {
            return [];
        }
    };

    const queries = useQueries({
        queries: (assetSpecifications ?? []).map((assetSpecification, index) => ({
            queryKey: ['dataset', `${assetSpecification.type}-${index}`],
            queryFn: () => fetchAssetsWithTimeout(assetSpecification),
            staleTime: 5 * 60 * 1000,
            retry: 2,
            retryDelay: 1000,
        })),
    });

    const datasets = useMemo(
        () =>
            queries.map((q, i) => {
                if (assetSpecifications) {
                    let status: 'pending' | 'error' | 'success';
                    if (q.isLoading) {
                        status = 'pending';
                    } else if (q.isError) {
                        status = 'error';
                    } else {
                        status = 'success';
                    }
                    const dataset = {
                        id: assetSpecifications[i].type,
                        type: assetSpecifications[i].type,
                        category: assetSpecifications[i].secondaryCategory,
                        status,
                        data: q.data,
                        error: q.error,
                    } as DatasetState;

                    return dataset;
                }
                return null;
            }),
        [queries, assetSpecifications],
    );

    const {
        data: staticAssets,
        isLoading: staticAssetsLoading,
        error: staticAssetsError,
    } = useQuery<Asset[]>({
        queryKey: ['staticAssets'],
        queryFn: async () => {
            const assetSpecifications = (await import('@/data/coeff-assets-with-geometry.json')).default as any[];
            return Array.from(assetSpecifications).map((asset) => new Asset(asset));
        },
    });

    const assets = useMemo(() => {
        if (staticAssetsLoading) {
            return;
        }
        const assets: Asset[] = [];
        for (const ds of datasets) {
            if (ds?.data) {
                assets.push(...ds.data);
            }
        }

        if (staticAssetsError || !staticAssets) {
            return assets;
        } else {
            return [...assets, ...staticAssets];
        }
    }, [datasets, staticAssets, staticAssetsError, staticAssetsLoading]);

    const assetsLoading = useMemo(() => {
        const allFinished = datasets.every((d) => d && (d.status === 'success' || d.status === 'error'));
        return !allFinished;
    }, [datasets]);

    const assetsError = useMemo(() => {
        return datasets.some((d) => d && d.status === 'error');
    }, [datasets]);

    const progress = useMemo(() => {
        const total = datasets.length;
        const completed = datasets.filter((d) => d && (d.status === 'success' || d.status === 'error')).length;
        const progressValue = total > 0 ? completed / total : 0;

        if (total > 0 && completed > 0 && progressValue >= 0.99) {
            return 1;
        }

        return progressValue;
    }, [datasets]);

    const fetchDependencies = async (assets: Asset[], assessment?: string): Promise<Dependency[]> => {
        if (!assets) {
            return [];
        }

        const assetTypes = assets.map((asset: { type: any }) => asset.type).filter((value, index, self) => self.indexOf(value) === index);

        if (assetTypes.length === 0) {
            return [];
        }

        const dependencyData = await fetchAssessmentDependencies(assetTypes, assessment);
        const validDependencies = (dependencyData || [])
            .filter((dep: any) => dep.dependentName && dep.providerName)
            .map((dep: any) => ({
                dependencyUri: dep.dependencyUri,
                criticalityRating: dep.criticalityRating,
                dependentNode: dep.dependentNode,
                dependentName: dep.dependentName,
                dependentNodeType: dep.dependentNodeType,
                providerNode: dep.providerNode,
                providerName: dep.providerName,
                providerNodeType: dep.providerNodeType,
                osmID: dep.osmID || '',
            }));

        return createDependencies(validDependencies);
    };

    const {
        data: dependencies,
        isLoading: dependenciesLoading,
        error: dependenciesError,
    } = useQuery({
        queryKey: ['assets-with-dependencies', assessment ?? ''],
        enabled: !assetsLoading,
        queryFn: () => fetchDependencies(assets, assessment),
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
                asset.primaryCategory?.toLowerCase().includes(searchFilterWithoutWhitespace) ||
                asset.secondaryCategory?.toLowerCase().includes(searchFilterWithoutWhitespace),
        );
    }, [assets, searchFilterWithoutWhitespace]);

    const getAssetsByTypes = (typeUris: string[]) => {
        if (!filteredAssets) {
            return [];
        }
        return filteredAssets.filter((asset) => typeUris.includes(asset.type));
    };
    const getDependenciesByTypes = (typeUris: string[]) => {
        if (!dependencies) {
            return [];
        }
        return dependencies.filter((dependency) => typeUris.includes(dependency.provider.type) && typeUris.includes(dependency.dependent.type));
    };

    const getDependentAssets = (assets: Asset[]) => {
        if (!dependencies || !filteredAssets) {
            return { dependencies: [], dependentAssets: [] };
        }

        const providerUris = new Set(assets.map((asset) => asset.uri));
        const filteredDependencies = dependencies.filter(({ provider }) => providerUris.has(provider.uri));
        const dependentUris = new Set(filteredDependencies.map(({ dependent }) => dependent.uri));
        const dependentAssets = filteredAssets.filter(({ uri }) => dependentUris.has(uri));

        return {
            dependencies: filteredDependencies,
            dependentAssets,
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
