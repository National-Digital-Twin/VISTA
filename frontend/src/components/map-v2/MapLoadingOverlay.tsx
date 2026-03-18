// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Box, CircularProgress } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import { useDrawingContext } from './context/DrawingContext';

type MapLoadingOverlayProps = {
    readonly isAssetsFetching: boolean;
    readonly isSpritesGenerating: boolean;
    readonly isFocusAreasFetching: boolean;
    readonly isExposureLayersFetching: boolean;
    readonly isConstraintsFetching: boolean;
    readonly isResourcesFetching: boolean;
};

const MapLoadingOverlay = ({
    isAssetsFetching,
    isSpritesGenerating,
    isFocusAreasFetching,
    isExposureLayersFetching,
    isConstraintsFetching,
    isResourcesFetching,
}: MapLoadingOverlayProps) => {
    const { drawingSyncComplete, mapRef, mapReady } = useDrawingContext();
    const [waitingForMapIdle, setWaitingForMapIdle] = useState(false);
    const wasDataLoadingRef = useRef(false);

    const isDataLoading =
        isAssetsFetching ||
        isSpritesGenerating ||
        isFocusAreasFetching ||
        isExposureLayersFetching ||
        isConstraintsFetching ||
        isResourcesFetching ||
        !drawingSyncComplete;

    useEffect(() => {
        if (isDataLoading) {
            setWaitingForMapIdle(false);
        } else if (wasDataLoadingRef.current) {
            setWaitingForMapIdle(true);
        }
        wasDataLoadingRef.current = isDataLoading;
    }, [isDataLoading]);

    useEffect(() => {
        if (!waitingForMapIdle) {
            return;
        }

        let completed = false;
        const map = mapReady && mapRef.current ? mapRef.current.getMap() : null;
        const complete = () => {
            if (completed) {
                return;
            }
            completed = true;
            clearTimeout(timeoutId);
            if (map) {
                map.off('idle', handleIdle);
            }
            setWaitingForMapIdle(false);
        };

        const handleIdle = () => {
            complete();
        };

        const timeoutId = setTimeout(() => {
            complete();
        }, 3000);

        if (map) {
            map.on('idle', handleIdle);

            const isAlreadyIdle =
                (typeof map.areTilesLoaded === 'function' ? map.areTilesLoaded() : true) &&
                (typeof map.isStyleLoaded === 'function' ? map.isStyleLoaded() : true) &&
                (typeof map.isMoving === 'function' ? !map.isMoving() : true);

            if (isAlreadyIdle) {
                complete();
            }
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
