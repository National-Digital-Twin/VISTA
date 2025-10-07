import Box from '@mui/material/Box';
import { useCallback, useEffect, useState } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import ToolbarButton from '@/components/Map/SideButtons/ToolbarButton';

export const TOOL_NAME = 'Map compass control';

export function SideButtons() {
    const { paralogMap: map } = useMap();
    const [bearing, setBearing] = useState(0);

    // Reset map to north
    const handleCompassClick = useCallback(() => {
        if (!map) {
            return;
        }
        map.easeTo({ bearing: 0 });
    }, [map]);

    // Track map bearing changes
    useEffect(() => {
        if (!map) {
            return;
        }

        setBearing(map.getBearing());

        const onRotate = () => {
            setBearing(map.getBearing());
        };

        map.on('rotate', onRotate);

        return () => {
            map.off('rotate', onRotate);
        };
    }, [map]);

    return (
        <Box sx={{ display: 'flex', justifyContent: 'end' }}>
            <ToolbarButton title="Compass" onClick={handleCompassClick} svgSrc="/icons/Compass.svg" compassRotation={-bearing} />
        </Box>
    );
}

export const SIDE_BUTTON_ORDER = 1;
