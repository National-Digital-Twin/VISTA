import { useCallback } from 'react';
import type { RefObject } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import ControlButton from '../ControlButton';

type ZoomOutButtonProps = {
    mapRef: RefObject<MapRef | null>;
};

const ZoomOutButton = ({ mapRef }: ZoomOutButtonProps) => {
    const handleClick = useCallback(() => {
        const map = mapRef.current?.getMap();
        if (map) {
            map.zoomOut({ duration: 300 });
        }
    }, [mapRef]);

    return (
        <ControlButton onClick={handleClick} aria-label="Zoom Out" tooltip="Zoom out">
            <img src="/icons/map-v2/remove.svg" alt="Zoom out" width={24} height={24} />
        </ControlButton>
    );
};

export default ZoomOutButton;
