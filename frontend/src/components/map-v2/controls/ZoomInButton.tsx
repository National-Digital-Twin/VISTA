import { useCallback } from 'react';
import type { RefObject } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import ControlButton from '../ControlButton';

type ZoomInButtonProps = {
    mapRef: RefObject<MapRef | null>;
};

const ZoomInButton = ({ mapRef }: ZoomInButtonProps) => {
    const handleClick = useCallback(() => {
        const map = mapRef.current?.getMap();
        if (map) {
            map.zoomIn({ duration: 300 });
        }
    }, [mapRef]);

    return (
        <ControlButton onClick={handleClick} aria-label="Zoom In" tooltip="Zoom in">
            <img src="/icons/map-v2/add.svg" alt="Zoom in" width={24} height={24} />
        </ControlButton>
    );
};

export default ZoomInButton;
