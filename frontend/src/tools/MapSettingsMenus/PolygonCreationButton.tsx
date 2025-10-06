import Box from '@mui/material/Box';
import ToolbarButton from '@/components/Map/SideButtons/ToolbarButton';
import { usePolygonToolbarStore } from '@/tools/Polygons/useStore';

export const TOOL_NAME = 'Polygon controls';

export default function PolygonCreationButton() {
    const { isActive, toggle } = usePolygonToolbarStore();

    return (
        <Box sx={{ display: 'flex', justifyContent: 'end' }}>
            <ToolbarButton title="Draw polygons" onClick={toggle} svgSrc="icons/polygons.svg" active={isActive} />
        </Box>
    );
}
