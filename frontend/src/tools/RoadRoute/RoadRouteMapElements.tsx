import { Source, Layer, Marker, MarkerDragEvent } from 'react-map-gl/maplibre';
import type { LngLat } from 'react-map-gl/maplibre';
import { useCallback, useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useRoadRouteSharedStore } from './useStore';
import useFloodExtents from './useFloodExtents';
import { useRoadRouteLazyQuery } from '@/api/paralog-python';

import useLayer from '@/hooks/useLayer';

export default function RoadRouteMapElements() {
    const { enabled } = useLayer('road-route');
    const [executeRoadRouteLazyQuery, { data }] = useRoadRouteLazyQuery();

    const floodExtent = useFloodExtents();

    const { startPosition, endPosition, setStartPosition, setEndPosition, vehicleType } = useRoadRouteSharedStore(
        useShallow((state) => ({
            startPosition: state.startPosition,
            endPosition: state.endPosition,
            setStartPosition: state.setStartPosition,
            setEndPosition: state.setEndPosition,
            vehicleType: state.vehicleType,
        })),
    );

    const handleStartPositionDragEnd = useCallback((event: MarkerDragEvent) => setStartPosition(event.lngLat as LngLat), [setStartPosition]);

    const handleEndPositionDragEnd = useCallback(({ lngLat }: MarkerDragEvent) => setEndPosition(lngLat as LngLat), [setEndPosition]);

    const queryVariables = useMemo(() => {
        if (!startPosition || !endPosition || !enabled) {
            return null;
        }
        return {
            startLat: startPosition.lat,
            startLon: startPosition.lng,
            endLat: endPosition.lat,
            endLon: endPosition.lng,

            floodExtent: floodExtent,
            vehicle: vehicleType,
        };
    }, [startPosition, endPosition, floodExtent, vehicleType, enabled]);

    useEffect(() => {
        if (!queryVariables) {
            return;
        }

        executeRoadRouteLazyQuery({
            variables: queryVariables,
        });
    }, [queryVariables, executeRoadRouteLazyQuery]);

    if (!enabled) {
        return null;
    }

    return (
        <>
            {startPosition && <Marker latitude={startPosition.lat} longitude={startPosition.lng} draggable onDragEnd={handleStartPositionDragEnd} />}
            {endPosition && <Marker latitude={endPosition.lat} longitude={endPosition.lng} draggable onDragEnd={handleEndPositionDragEnd} />}
            {data && startPosition && endPosition && (
                <Source id="road-route" type="geojson" data={data.roadRoute.routeGeojson}>
                    <Layer
                        id="road-route"
                        type="line"
                        source="road-route"
                        layout={{
                            'line-join': 'round',
                            'line-cap': 'round',
                        }}
                        paint={{
                            'line-color': 'rebeccapurple',
                            'line-width': 3,
                        }}
                    />
                </Source>
            )}
        </>
    );
}
