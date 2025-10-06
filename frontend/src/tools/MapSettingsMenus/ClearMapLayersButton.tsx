import { useCallback } from 'react';
import Box from '@mui/material/Box';
import { resetHashStorage } from '@/hooks/createStore';

import ToolbarButton from '@/components/Map/SideButtons/ToolbarButton';

export const TOOL_NAME = 'Clear Map Layers';

export default function ClearMapLayersButton() {
    const handleClear = useCallback(() => {
        if (window.confirm('Are you sure you want to reset all layers?')) {
            resetHashStorage();
        }
    }, []);

    return (
        <Box sx={{ display: 'flex', justifyContent: 'end' }}>
            <ToolbarButton title="Clear Map Layers" onClick={handleClear} svgSrc="icons/Clear layers.svg" />
        </Box>
    );
}
