import Box from '@mui/material/Box';
import { useCallback } from 'react';
import { useMap } from 'react-map-gl/maplibre';

import ToolbarButton from '@/components/Map/SideButtons/ToolbarButton';

export const TOOL_NAME = 'Map zoom controls';

export function SideButtons() {
    const { paralogMap: map } = useMap();

    const handleZoomOut = useCallback(() => {
        if (!map) {
            return;
        }
        map.zoomOut({ duration: 1000 });
    }, [map]);

    const handleZoomIn = useCallback(() => {
        if (!map) {
            return;
        }
        map.zoomIn({ duration: 1000 });
    }, [map]);

    return (
        <Box sx={{ display: 'flex', justifyContent: 'end' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <ToolbarButton title="Zoom in" onClick={handleZoomIn} svgSrc="icons/Zoom in.svg" hasNoMarginBottom />
                <Box sx={{ marginTop: '0.1rem' }}>
                    <ToolbarButton title="Zoom out" onClick={handleZoomOut} svgSrc="icons/Zoom out.svg" />
                </Box>
            </Box>
        </Box>
    );
}

export const SIDE_BUTTON_ORDER = 1;
