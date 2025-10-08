import { useContext, useEffect, useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';

import { ElementsContext } from '@/context/ElementContext';
import { fetchFloodAreaPolygon } from '@/api/combined';

export default function useFloodAreaPolygons(selectedFloodAreas: string[]) {
    const context = useContext(ElementsContext);
    const updateErrorNotifications = context?.updateErrorNotifications;

    const queries = useQueries({
        queries: selectedFloodAreas.map((polygonUri) => ({
            enabled: Boolean(polygonUri),
            queryKey: ['flood-area-polygon', polygonUri],
            queryFn: () => fetchFloodAreaPolygon(polygonUri).then((data) => [polygonUri, data.features]),
        })),
    });

    const data = useMemo(() => {
        const result: Record<string, any> = {};
        for (const query of queries) {
            if (query.data?.[0] && query.data?.[1]) {
                result[query.data[0]] = query.data[1];
            }
        }
        return result;
    }, [queries]);

    const isLoading = useMemo(() => {
        return queries.some((result) => result.isLoading);
    }, [queries]);

    const isSuccess = useMemo(() => {
        return queries.some((result) => result.isSuccess);
    }, [queries]);

    const isError = useMemo(() => {
        return queries.some((result) => result.isError);
    }, [queries]);

    const errors = useMemo(() => {
        return queries.map((result) => result.error);
    }, [queries]);

    useEffect(() => {
        if (isError && updateErrorNotifications) {
            for (const error of errors) {
                if (error) {
                    updateErrorNotifications(error.message);
                }
            }
        }
    }, [isError, errors, updateErrorNotifications]);

    return {
        polygonFeatures: data,
        isLoading,
        isSuccess,
    };
}
