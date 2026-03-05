// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

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
