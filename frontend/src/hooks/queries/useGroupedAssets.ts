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
    status: 'pending' | 'success' | 'error' | 'timeout';
    data?: T;
    error?: unknown;
    timedOut?: boolean;
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
        const TIMEOUT_MS = 45000;

        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => {
                reject(new Error('Query timeout'));
            }, TIMEOUT_MS);
        });

        try {
            const fetchPromise = fetchAssetsForAssetSpecification(assetSpecification)
                .then((result) => {
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                    }
                    return { data: result, timedOut: false };
                })
                .catch((error) => {
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                    }
                    throw error;
                });

            const result = await Promise.race([fetchPromise, timeoutPromise]);
            return result.data;
        } catch (error) {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            const isTimeout = error instanceof Error && error.message === 'Query timeout';
            if (isTimeout) {
                return { __timeout: true };
            }
            throw error;
        }
    };

    const queries = useQueries({
        queries: (assetSpecifications ?? []).map((assetSpecification, index) => ({
            queryKey: ['dataset', `${assetSpecification.type}-${index}`],
            queryFn: () => fetchAssetsWithTimeout(assetSpecification),
            staleTime: 5 * 60 * 1000,
            retry: false,
            retryDelay: 1000,
        })),
    });

    const datasets = useMemo(
        () =>
            queries.map((q, i) => {
                if (assetSpecifications) {
                    let status: 'pending' | 'error' | 'success' | 'timeout';
                    let timedOut = false;
                    let data = q.data;

                    if (q.isLoading) {
                        status = 'pending';
                    } else if (q.isError) {
                        status = 'error';
                    } else if (q.data && typeof q.data === 'object' && '__timeout' in q.data) {
                        status = 'timeout';
                        timedOut = true;
                        data = undefined;
                    } else {
                        status = 'success';
                    }

                    const dataset = {
                        id: assetSpecifications[i].type,
                        type: assetSpecifications[i].type,
                        category: assetSpecifications[i].secondaryCategory,
                        status,
                        data,
                        error: q.error,
                        timedOut,
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
        const allFinished = datasets.every((d) => d && (d.status === 'success' || d.status === 'error' || d.status === 'timeout'));
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

    const {
        data: dependencies,
        isLoading: dependenciesLoading,
        error: dependenciesError,
    } = useQuery({
        queryKey: ['assets-with-dependencies', assessment ?? ''],
        enabled: !assetsLoading && !!assessment && assessment.trim() !== '',
        queryFn: async () => {
            if (!assets || !assessment) {
                return [];
            }
            const assetTypes = assets.map((asset: { type: any }) => asset.type).filter((value, index, self) => self.indexOf(value) === index);
            let dependencies: Dependency[];
            if (assetTypes.length > 0) {
                const dependencyData = await fetchAssessmentDependencies(assetTypes, assessment);
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
