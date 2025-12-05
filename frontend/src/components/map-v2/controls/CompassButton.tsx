import { useCallback } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import type { RefObject } from 'react';
import ControlButton from '../ControlButton';

type CompassButtonProps = {
    mapRef: RefObject<MapRef | null>;
    bearing?: number;
};

const CompassButton = ({ mapRef, bearing = 0 }: CompassButtonProps) => {
    const handleClick = useCallback(() => {
        const map = mapRef.current?.getMap();
        if (map) {
            map.easeTo({
                bearing: 0,
                pitch: 0,
                duration: 1000,
            });
        }
    }, [mapRef]);

    return (
        <ControlButton onClick={handleClick} aria-label="Reset View" tooltip="Reset view to north">
            <img src="/icons/map-v2/compass.svg" alt="Reset view" style={{ transform: `rotate(${-bearing}deg)` }} width={24} height={24} />
        </ControlButton>
    );
};

export default CompassButton;
