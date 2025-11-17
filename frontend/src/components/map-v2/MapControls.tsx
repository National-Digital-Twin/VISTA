import { Box, styled } from '@mui/material';
import { useEffect, useRef } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import type { ViewState } from 'react-map-gl';
import type { RefObject } from 'react';
import CompassButton from './controls/CompassButton';
import ZoomInButton from './controls/ZoomInButton';
import ZoomOutButton from './controls/ZoomOutButton';
import LegendButton from './controls/LegendButton';
import MapStyleButton from './controls/MapStyleButton';
import DrawPolygonButton from './controls/DrawPolygonButton';
import FloodWarningsButton from './controls/FloodWarningsButton';
import LegendPanel from './controls/panels/LegendPanel';
import MapStylePanel from './controls/panels/MapStylePanel';
import FloodWarningsPanel from './controls/panels/FloodWarningsPanel';
import type { MapStyleKey } from './constants';

const ControlsContainer = styled(Box)({
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    position: 'absolute',
    right: '1rem',
    top: '1rem',
    zIndex: 1,
});

const ControlGroup = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[2],
    display: 'flex',
    flexDirection: 'column',
}));

const ControlDivider = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.divider,
    height: 2,
    width: '100%',
}));

interface MapControlsProps {
    readonly mapRef: RefObject<MapRef | null>;
    readonly legendOpen: boolean;
    readonly onToggleLegend: () => void;
    readonly floodWarningsOpen: boolean;
    readonly onToggleFloodWarnings: () => void;
    readonly onClosePanels: () => void;
    readonly isDrawing: boolean;
    readonly onToggleDrawing: () => void;
    readonly mapStyleKey: MapStyleKey;
    readonly onMapStyleChange: (style: MapStyleKey) => void;
    readonly mapStylePanelOpen: boolean;
    readonly onToggleMapStylePanel: () => void;
    readonly viewState?: ViewState;
}

const MapControls = ({
    mapRef,
    legendOpen,
    onToggleLegend,
    floodWarningsOpen,
    onToggleFloodWarnings,
    onClosePanels,
    isDrawing,
    onToggleDrawing,
    mapStyleKey,
    onMapStyleChange,
    mapStylePanelOpen,
    onToggleMapStylePanel,
    viewState,
}: MapControlsProps) => {
    const legendPanelRef = useRef<HTMLDivElement>(null);
    const mapStylePanelRef = useRef<HTMLDivElement>(null);
    const floodWarningsPanelRef = useRef<HTMLDivElement>(null);
    const legendButtonRef = useRef<HTMLButtonElement>(null);
    const mapStyleButtonRef = useRef<HTMLButtonElement>(null);
    const floodWarningsButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!legendOpen && !mapStylePanelOpen && !floodWarningsOpen) {
            return;
        }

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;

            if (legendPanelRef.current?.contains(target)) {
                return;
            }

            if (mapStylePanelRef.current?.contains(target)) {
                return;
            }

            if (floodWarningsPanelRef.current?.contains(target)) {
                return;
            }

            if (legendButtonRef.current?.contains(target)) {
                return;
            }

            if (mapStyleButtonRef.current?.contains(target)) {
                return;
            }

            if (floodWarningsButtonRef.current?.contains(target)) {
                return;
            }

            const drawingToolbar = document.querySelector('[role="group"][aria-label="Drawing tools"], [role="group"][aria-label="Asset filters"]');
            if (drawingToolbar?.contains(target)) {
                return;
            }

            onClosePanels();
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [legendOpen, mapStylePanelOpen, floodWarningsOpen, onClosePanels]);

    return (
        <ControlsContainer>
            <ControlGroup role="group" aria-label="Flood warnings controls" sx={{ position: 'relative' }}>
                <FloodWarningsButton ref={floodWarningsButtonRef} isOpen={floodWarningsOpen} onToggle={onToggleFloodWarnings} />
                <Box sx={{ position: 'absolute', top: 0, right: 'calc(100% + 1rem)' }}>
                    <FloodWarningsPanel ref={floodWarningsPanelRef} open={floodWarningsOpen} />
                </Box>
            </ControlGroup>

            <ControlGroup role="group" aria-label="View controls">
                <CompassButton mapRef={mapRef} bearing={viewState?.bearing ?? 0} />
            </ControlGroup>

            <ControlGroup role="group" aria-label="Zoom controls">
                <ZoomInButton mapRef={mapRef} />
                <ControlDivider />
                <ZoomOutButton mapRef={mapRef} />
            </ControlGroup>

            <ControlGroup role="group" aria-label="Drawing controls">
                <DrawPolygonButton isActive={isDrawing} onToggle={onToggleDrawing} />
            </ControlGroup>

            <ControlGroup role="group" aria-label="Map style controls" sx={{ position: 'relative' }}>
                <MapStyleButton ref={mapStyleButtonRef} isOpen={mapStylePanelOpen} onToggle={onToggleMapStylePanel} />
                <Box sx={{ position: 'absolute', top: 0, right: 'calc(100% + 1rem)' }}>
                    <MapStylePanel
                        ref={mapStylePanelRef}
                        currentStyle={mapStyleKey}
                        onStyleChange={onMapStyleChange}
                        isOpen={mapStylePanelOpen}
                        onToggle={onToggleMapStylePanel}
                    />
                </Box>
            </ControlGroup>

            <ControlGroup role="group" aria-label="Map legend controls" sx={{ position: 'relative' }}>
                <LegendButton ref={legendButtonRef} isOpen={legendOpen} onToggle={onToggleLegend} />
                <Box sx={{ position: 'absolute', top: 0, right: 'calc(100% + 1rem)' }}>
                    <LegendPanel ref={legendPanelRef} open={legendOpen} />
                </Box>
            </ControlGroup>
        </ControlsContainer>
    );
};

export default MapControls;
