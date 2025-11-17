import { useCallback } from 'react';
import { Box, Divider, FormControlLabel, styled } from '@mui/material';
import type MapboxDraw from '@mapbox/mapbox-gl-draw';
import type { RefObject } from 'react';
import ControlButton from './ControlButton';
import ToggleSwitch from '@/components/ToggleSwitch';

const ToolbarContainer = styled(Box)({
    display: 'flex',
    flexDirection: 'row',
    gap: '1rem',
    position: 'absolute',
    right: '5rem',
    top: '1rem',
    zIndex: 1,
});

const ToolbarGroup = styled(Box)(({ theme }) => ({
    alignItems: 'center',
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[2],
    display: 'flex',
    flexDirection: 'row',
    position: 'relative',
}));

const VerticalDivider = styled(Divider)(({ theme }) => ({
    backgroundColor: theme.palette.divider,
    width: 2,
}));

interface DrawingToolbarProps {
    readonly drawRef: RefObject<MapboxDraw | null>;
    readonly drawingMode: 'circle' | 'polygon' | null;
    readonly onDrawingModeChange: (mode: 'circle' | 'polygon' | null) => void;
    readonly primaryAssets: boolean;
    readonly onPrimaryAssetsChange: (enabled: boolean) => void;
    readonly dependentAssets: boolean;
    readonly onDependentAssetsChange: (enabled: boolean) => void;
}

const DrawingToolbar = ({
    drawRef,
    drawingMode,
    onDrawingModeChange,
    primaryAssets,
    onPrimaryAssetsChange,
    dependentAssets,
    onDependentAssetsChange,
}: DrawingToolbarProps) => {
    const handleDrawCircle = useCallback(() => {
        if (!drawRef.current) {
            return;
        }
        if (drawingMode === 'circle') {
            drawRef.current.changeMode('simple_select');
            onDrawingModeChange(null);
        } else {
            drawRef.current.changeMode('drag_circle');
            onDrawingModeChange('circle');
        }
    }, [drawRef, drawingMode, onDrawingModeChange]);

    const handleDrawPolygon = useCallback(() => {
        if (!drawRef.current) {
            return;
        }
        if (drawingMode === 'polygon') {
            drawRef.current.changeMode('simple_select');
            onDrawingModeChange(null);
        } else {
            drawRef.current.changeMode('draw_polygon');
            onDrawingModeChange('polygon');
        }
    }, [drawRef, drawingMode, onDrawingModeChange]);

    return (
        <ToolbarContainer>
            <ToolbarGroup role="group" aria-label="Drawing tools">
                <ControlButton
                    onClick={handleDrawCircle}
                    aria-label={drawingMode === 'circle' ? 'Stop drawing circle' : 'Draw circle'}
                    tooltip={drawingMode === 'circle' ? 'Stop drawing circle' : 'Draw circle'}
                    isActive={drawingMode === 'circle'}
                >
                    <img src="/icons/map-v2/circle.svg" alt="Draw circle" width={24} height={24} />
                </ControlButton>
                <VerticalDivider orientation="vertical" />
                <ControlButton
                    onClick={handleDrawPolygon}
                    aria-label={drawingMode === 'polygon' ? 'Stop drawing polygon' : 'Draw polygon'}
                    tooltip={drawingMode === 'polygon' ? 'Stop drawing polygon' : 'Draw polygon'}
                    isActive={drawingMode === 'polygon'}
                >
                    <img src="/icons/map-v2/pencil.svg" alt="Draw polygon" width={24} height={24} />
                </ControlButton>
            </ToolbarGroup>

            <ToolbarGroup role="group" aria-label="Asset filters" sx={{ gap: '0.5rem', padding: '0.5rem' }}>
                <FormControlLabel
                    control={<ToggleSwitch checked={primaryAssets} onChange={(e) => onPrimaryAssetsChange(e.target.checked)} />}
                    label="Primary assets"
                    sx={{ margin: 0 }}
                />
                <VerticalDivider orientation="vertical" />
                <FormControlLabel
                    control={<ToggleSwitch checked={dependentAssets} onChange={(e) => onDependentAssetsChange(e.target.checked)} />}
                    label="Dependent assets"
                    sx={{ margin: 0 }}
                />
            </ToolbarGroup>
        </ToolbarContainer>
    );
};

export default DrawingToolbar;
