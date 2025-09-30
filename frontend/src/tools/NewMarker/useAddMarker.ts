import { LngLat, MapMouseEvent } from 'maplibre-gl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import { useMousePositionStore } from './useStore';

interface UseAddMarkerOptions {
    onSelectMarkerPosition: (position: LngLat, event: MapMouseEvent) => void | Promise<void>;
}

export const useAddMarker = ({ onSelectMarkerPosition }: UseAddMarkerOptions) => {
    const [isSelectingPosition, setIsSelectingPosition] = useState(false);

    const { paralogMap: map } = useMap();

    const setMousePosition = useMousePositionStore((state) => state.setMousePosition);

    const handleMouseMove = useCallback(
        ({ lngLat: { lat: latitude, lng: longitude } }: MapMouseEvent) => {
            setMousePosition({ latitude, longitude });
        },
        [setMousePosition],
    );

    const handleMapClick = useCallback(
        async (event: MapMouseEvent) => {
            map.off('mousemove', handleMouseMove);
            map.off('click', handleMapClick);
            setMousePosition(null);
            setIsSelectingPosition(false);

            await onSelectMarkerPosition(event.lngLat, event);
        },
        [map, handleMouseMove, setMousePosition, onSelectMarkerPosition],
    );

    const abortMousePositioning = useCallback(() => {
        map.off('mousemove', handleMouseMove);
        map.off('click', handleMapClick);
        setMousePosition(null);
        setIsSelectingPosition(false);
    }, [handleMapClick, handleMouseMove, map, setMousePosition]);

    const startAddMarker = useCallback(() => {
        map.on('mousemove', handleMouseMove);
        map.on('click', handleMapClick);

        setIsSelectingPosition(true);
    }, [map, handleMapClick, handleMouseMove]);

    useEffect(
        function deregisterEvents() {
            return abortMousePositioning;
        },
        [abortMousePositioning],
    );

    return useMemo(() => ({ startAddMarker, abortMousePositioning, isSelectingPosition }), [startAddMarker, abortMousePositioning, isSelectingPosition]);
};
