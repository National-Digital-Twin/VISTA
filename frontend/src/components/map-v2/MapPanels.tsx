import type { ReactElement } from 'react';
import { Box, Paper } from '@mui/material';
import MapPanelButton from './MapPanelButton';
import ScenarioView from './panels/ScenarioView';
import AssetsView from './panels/AssetsView';
import ExposureView from './panels/ExposureView';
import FocusAreaView from './panels/FocusAreaView';
import UtilitiesView from './panels/UtilitiesView';
import AssetDetailsPanel from './panels/AssetDetailsPanel';
import type { Asset } from '@/api/assets-by-type';

const RAIL_WIDTH = 80;
const PANEL_WIDTH = 420;

type MapPanelItem = {
    id: string;
    label: string;
    icon: ReactElement;
};

const FIXED_ITEMS: readonly MapPanelItem[] = [
    {
        id: 'focus-area',
        label: 'Focus area',
        icon: <img src="/icons/map-v2/focus-area.svg" alt="Focus area" width={24} height={24} />,
    },
    {
        id: 'assets',
        label: 'Assets',
        icon: <img src="/icons/map-v2/assets.svg" alt="Assets" width={24} height={24} />,
    },
    {
        id: 'scenario',
        label: 'Scenario',
        icon: <img src="/icons/map-v2/scenario.svg" alt="Scenario" width={24} height={24} />,
    },
    {
        id: 'exposure',
        label: 'Exposure',
        icon: <img src="/icons/map-v2/exposure.svg" alt="Exposure" width={24} height={24} />,
    },
    {
        id: 'utilities',
        label: 'Utilities',
        icon: <img src="/icons/map-v2/utilities.svg" alt="Utilities" width={24} height={24} />,
    },
];

type RoadRoutePosition = {
    readonly lat: number;
    readonly lng: number;
} | null;

type MapPanelsProps = {
    activeView?: string | null;
    onViewChange?: (viewId: string | null) => void;
    selectedFocusAreaId?: string | null;
    selectedUtilityIds?: Record<string, boolean>;
    onUtilityToggle?: (utilityId: string, enabled: boolean) => void;
    selectedElement?: Asset | null;
    onBackFromAssetDetails?: () => void;
    scenarioId?: string;
    isDrawing?: boolean;
    onStartDrawing?: (mode: 'circle' | 'polygon') => void;
    roadRouteStart?: RoadRoutePosition;
    roadRouteEnd?: RoadRoutePosition;
    roadRouteVehicle?: 'HGV' | 'EmergencyVehicle' | 'Car';
    roadRouteLoading?: boolean;
    roadRouteError?: Error | null;
    roadRouteData?: { routeGeojson: { features: Array<{ properties?: { length?: number; travel_time?: number; speed_kph?: number } }> } };
    onRoadRouteVehicleChange?: (vehicle: 'HGV' | 'EmergencyVehicle' | 'Car' | undefined) => void;
    onRequestPositionSelection?: (type: 'start' | 'end' | null) => void;
    onFocusAreaSelect?: (focusAreaId: string | null) => void;
};

const MapPanels = ({
    activeView,
    onViewChange,
    selectedFocusAreaId,
    selectedUtilityIds,
    onUtilityToggle,
    selectedElement,
    onBackFromAssetDetails,
    scenarioId,
    isDrawing,
    onStartDrawing,
    roadRouteStart,
    roadRouteEnd,
    roadRouteVehicle,
    roadRouteLoading,
    roadRouteError,
    roadRouteData,
    onRoadRouteVehicleChange,
    onRequestPositionSelection,
    onFocusAreaSelect,
}: Readonly<MapPanelsProps>) => {
    const handleItemClick = (itemId: string) => {
        const newActiveView = activeView === itemId ? null : itemId;
        onViewChange?.(newActiveView);
    };

    const handleClosePanel = () => {
        onViewChange?.(null);
    };

    const renderPanelContent = () => {
        if (!activeView) {
            return null;
        }

        switch (activeView) {
            case 'scenario':
                return <ScenarioView onItemClick={handleItemClick} onClose={handleClosePanel} />;
            case 'assets':
                return (
                    <AssetsView
                        onClose={handleClosePanel}
                        scenarioId={scenarioId}
                        selectedFocusAreaId={selectedFocusAreaId}
                        onFocusAreaSelect={onFocusAreaSelect}
                    />
                );
            case 'exposure':
                return (
                    <ExposureView
                        onClose={handleClosePanel}
                        scenarioId={scenarioId}
                        selectedFocusAreaId={selectedFocusAreaId}
                        onFocusAreaSelect={onFocusAreaSelect}
                    />
                );
            case 'utilities':
                return (
                    <UtilitiesView
                        onClose={handleClosePanel}
                        selectedUtilityIds={selectedUtilityIds}
                        onUtilityToggle={onUtilityToggle}
                        roadRouteStart={roadRouteStart}
                        roadRouteEnd={roadRouteEnd}
                        roadRouteVehicle={roadRouteVehicle}
                        roadRouteLoading={roadRouteLoading}
                        roadRouteError={roadRouteError}
                        roadRouteData={roadRouteData}
                        onRoadRouteVehicleChange={onRoadRouteVehicleChange}
                        onRequestPositionSelection={onRequestPositionSelection}
                    />
                );
            case 'focus-area':
                return (
                    <FocusAreaView
                        onClose={handleClosePanel}
                        scenarioId={scenarioId}
                        isDrawing={isDrawing}
                        onStartDrawing={onStartDrawing}
                        selectedFocusAreaId={selectedFocusAreaId}
                        onFocusAreaSelect={onFocusAreaSelect}
                    />
                );
            case 'asset-details':
                if (!onBackFromAssetDetails) {
                    return null;
                }
                return <AssetDetailsPanel selectedElement={selectedElement || null} onBack={onBackFromAssetDetails} />;
            default:
                return null;
        }
    };

    const isAssetDetailsActive = activeView === 'asset-details';
    const isAssetsHighlighted = activeView === 'assets' || isAssetDetailsActive;

    return (
        <Box
            sx={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                display: 'flex',
                zIndex: 0,
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    width: RAIL_WIDTH,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: 'background.paper',
                    borderRadius: 0,
                    position: 'relative',
                    zIndex: 2,
                }}
            >
                <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
                    {FIXED_ITEMS.map((item) => {
                        const isActive = item.id === 'assets' ? isAssetsHighlighted : activeView === item.id;
                        return (
                            <MapPanelButton key={item.id} label={item.label} icon={item.icon} isActive={isActive} onClick={() => handleItemClick(item.id)} />
                        );
                    })}
                </Box>
            </Paper>

            {activeView && (
                <Paper
                    elevation={0}
                    sx={{
                        'width': PANEL_WIDTH,
                        'height': '100%',
                        'display': 'flex',
                        'flexDirection': 'column',
                        'bgcolor': 'background.paper',
                        'borderRadius': 0,
                        'borderLeft': '1px solid',
                        'borderColor': 'divider',
                        'overflow': 'hidden',
                        'position': 'relative',
                        'zIndex': 1,
                        'animation': 'slideIn 0.2s ease-in-out',
                        '@keyframes slideIn': {
                            from: {
                                transform: 'translateX(-100%)',
                            },
                            to: {
                                transform: 'translateX(0)',
                            },
                        },
                    }}
                >
                    <Box sx={{ flex: 1, overflowY: 'auto' }}>{renderPanelContent()}</Box>
                </Paper>
            )}
        </Box>
    );
};

export default MapPanels;
