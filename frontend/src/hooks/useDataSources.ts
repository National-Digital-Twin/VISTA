import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchDataSources, type DataSource } from '@/api/datasources';

export const useDataSources = () => {
    const {
        data: dataSources,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['dataSources'],
        queryFn: fetchDataSources,
        staleTime: 5 * 60 * 1000,
    });

    const dataSourceMap = useMemo(() => {
        if (!dataSources) {
            return new Map<string, DataSource>();
        }
        return new Map(dataSources.map((ds) => [ds.id, ds]));
    }, [dataSources]);

    return { dataSources, dataSourceMap, isLoading, isError };
};
