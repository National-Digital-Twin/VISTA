import { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useDrawingContext } from './context/DrawingContext';

type MapLoadingOverlayProps = {
    readonly isAssetsFetching: boolean;
    readonly isSpritesGenerating: boolean;
    readonly isFocusAreasFetching: boolean;
    readonly isExposureLayersFetching: boolean;
};

const MapLoadingOverlay = ({ isAssetsFetching, isSpritesGenerating, isFocusAreasFetching, isExposureLayersFetching }: MapLoadingOverlayProps) => {
    const { drawingSyncComplete, mapRef, mapReady } = useDrawingContext();
    const [waitingForMapIdle, setWaitingForMapIdle] = useState(false);
    const wasDataLoadingRef = useRef(false);

    const isDataLoading = isAssetsFetching || isSpritesGenerating || isFocusAreasFetching || isExposureLayersFetching || !drawingSyncComplete;

    useEffect(() => {
        if (wasDataLoadingRef.current && !isDataLoading) {
            setWaitingForMapIdle(true);
        }
        wasDataLoadingRef.current = isDataLoading;
    }, [isDataLoading]);

    useEffect(() => {
        if (!waitingForMapIdle || !mapReady || !mapRef.current) {
            return;
        }

        const map = mapRef.current.getMap();
        if (!map) {
            setWaitingForMapIdle(false);
            return;
        }

        let completed = false;

        const handleIdle = () => {
            complete();
        };

        // Avoid the spinning forever if the map never becomes idle.
        const timeoutId = setTimeout(() => {
            complete();
        }, 3000);

        const complete = () => {
            if (completed) {
                return;
            }
            completed = true;
            clearTimeout(timeoutId);
            map.off('idle', handleIdle);
            setWaitingForMapIdle(false);
        };

        // Attach listener first, then check if already idle
        // This order prevents the race condition where idle fires between check and attach
        map.on('idle', handleIdle);

        const isAlreadyIdle =
            (typeof map.areTilesLoaded === 'function' ? map.areTilesLoaded() : true) &&
            (typeof map.isStyleLoaded === 'function' ? map.isStyleLoaded() : true) &&
            (typeof map.isMoving === 'function' ? !map.isMoving() : true);

        if (isAlreadyIdle) {
            complete();
        }

        return () => {
            complete();
        };
    }, [waitingForMapIdle, mapRef, mapReady]);

    const isLoading = isDataLoading || waitingForMapIdle;

    return (
        <Box
            sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                zIndex: 10,
                opacity: isLoading ? 1 : 0,
                pointerEvents: isLoading ? 'auto' : 'none',
                transition: 'opacity 200ms ease-out',
            }}
        >
            <CircularProgress size={48} />
        </Box>
    );
};

export default MapLoadingOverlay;
