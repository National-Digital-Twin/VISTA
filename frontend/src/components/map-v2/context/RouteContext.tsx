import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { calculateRoute, type Coordinate, type RoadRouteInputParams, type RoadRouteResponse } from '@/api/utilities';

type RouteContextValue = {
    start: Coordinate | null;
    end: Coordinate | null;
    setStart: (pos: Coordinate | null) => void;
    setEnd: (pos: Coordinate | null) => void;
    vehicle: RoadRouteInputParams['vehicle'];
    setVehicle: (v: RoadRouteInputParams['vehicle']) => void;
    positionSelectionMode: 'start' | 'end' | null;
    setPositionSelectionMode: (mode: 'start' | 'end' | null) => void;
    routeData: RoadRouteResponse | undefined;
    isLoading: boolean;
    error: Error | null;
    findRoute: () => void;
    showAdditionalSummary: boolean;
    setShowAdditionalSummary: (v: boolean) => void;
    showDirectLine: boolean;
    setShowDirectLine: (v: boolean) => void;
};

const RouteContext = createContext<RouteContextValue | null>(null);

type RouteProviderProps = {
    children: ReactNode;
    scenarioId: string | undefined;
};

export const RouteProvider = ({ children, scenarioId }: RouteProviderProps) => {
    const [start, setStart] = useState<Coordinate | null>(null);
    const [end, setEnd] = useState<Coordinate | null>(null);
    const [vehicle, setVehicle] = useState<RoadRouteInputParams['vehicle']>('Car');
    const [positionSelectionMode, setPositionSelectionMode] = useState<'start' | 'end' | null>(null);
    const [showAdditionalSummary, setShowAdditionalSummary] = useState(true);
    const [showDirectLine, setShowDirectLine] = useState(false);

    const {
        data: routeData,
        isFetching: isLoading,
        error: routeError,
        refetch,
    } = useQuery({
        queryKey: ['roadRoute', scenarioId, start, end, vehicle],
        queryFn: () =>
            calculateRoute(scenarioId!, {
                start: start!,
                end: end!,
                vehicle,
            }),
        enabled: !!scenarioId && !!start && !!end,
        staleTime: 0,
    });

    const findRoute = useCallback(() => {
        if (start && end && scenarioId) {
            refetch();
        }
    }, [start, end, scenarioId, refetch]);

    const handleSetStart = useCallback((pos: Coordinate | null) => {
        setStart(pos);
    }, []);

    const handleSetEnd = useCallback((pos: Coordinate | null) => {
        setEnd(pos);
    }, []);

    const handleSetVehicle = useCallback((v: RoadRouteInputParams['vehicle']) => {
        setVehicle(v);
    }, []);

    const contextValue = useMemo(
        (): RouteContextValue => ({
            start,
            end,
            setStart: handleSetStart,
            setEnd: handleSetEnd,
            vehicle,
            setVehicle: handleSetVehicle,
            positionSelectionMode,
            setPositionSelectionMode,
            routeData,
            isLoading,
            error: routeError as Error | null,
            findRoute,
            showAdditionalSummary,
            setShowAdditionalSummary,
            showDirectLine,
            setShowDirectLine,
        }),
        [
            start,
            end,
            handleSetStart,
            handleSetEnd,
            vehicle,
            handleSetVehicle,
            positionSelectionMode,
            routeData,
            isLoading,
            routeError,
            findRoute,
            showAdditionalSummary,
            showDirectLine,
        ],
    );

    return <RouteContext.Provider value={contextValue}>{children}</RouteContext.Provider>;
};

export const useRouteContext = (): RouteContextValue => {
    const context = useContext(RouteContext);
    if (!context) {
        throw new Error('useRouteContext must be used within a RouteProvider');
    }
    return context;
};

export default RouteContext;
