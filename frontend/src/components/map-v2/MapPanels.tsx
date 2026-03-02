import { Box, Divider, Paper } from '@mui/material';
import type { ReactElement } from 'react';
import MapPanelButton from './MapPanelButton';
import AssetsView from './panels/AssetsView';
import ConstraintsView from './panels/ConstraintsView';
import ExposureView from './panels/ExposureView';
import FocusAreaView from './panels/FocusAreaView';
import InspectorView from './panels/InspectorView';
import ResourcesView from './panels/ResourcesView';
import UtilitiesView from './panels/UtilitiesView';
import type { Asset } from '@/api/assets-by-type';
import type { ConstraintInterventionType } from '@/api/constraint-interventions';
import type { ExposureLayersResponse } from '@/api/exposure-layers';
import type { FocusArea } from '@/api/focus-areas';
import type { ResourceType } from '@/api/resources';

const RAIL_WIDTH = 80;
const PANEL_WIDTH = 420;

type MapPanelItem = {
    type: 'item';
    id: string;
    label: string;
    icon: ReactElement;
};

type MapPanelSeparator = {
    type: 'separator';
    id: string;
};

type MapPanelEntry = MapPanelItem | MapPanelSeparator;

const FIXED_ITEMS: readonly MapPanelEntry[] = [
    {
        type: 'item',
        id: 'focus-area',
        label: 'Focus area',
        icon: <img src="/icons/map-v2/focus-area.svg" alt="Focus area" width={24} height={24} />,
    },
    {
        type: 'separator',
        id: 'separator-1',
    },
    {
        type: 'item',
        id: 'assets',
        label: 'Assets',
        icon: <img src="/icons/map-v2/assets.svg" alt="Assets" width={24} height={24} />,
    },
    {
        type: 'item',
        id: 'exposure',
        label: 'Exposure',
        icon: <img src="/icons/map-v2/exposure.svg" alt="Exposure" width={24} height={24} />,
    },
    {
        type: 'item',
        id: 'inspector',
        label: 'Inspector',
        icon: <img src="/icons/map-v2/mystery.svg" alt="Inspector" width={24} height={24} />,
    },
    {
        type: 'item',
        id: 'utilities',
        label: 'Utilities',
        icon: <img src="/icons/map-v2/utilities.svg" alt="Utilities" width={24} height={24} />,
    },
    {
        type: 'separator',
        id: 'separator-2',
    },
    {
        type: 'item',
        id: 'resources',
        label: 'Resources',
        icon: <img src="/icons/map-v2/resources.svg" alt="Resources" width={24} height={24} />,
    },
    {
        type: 'item',
        id: 'constraints',
        label: 'Constraints',
        icon: <img src="/icons/map-v2/constraints.svg" alt="Constraints" width={24} height={24} />,
    },
];

type MapPanelsProps = {
    activeView?: string | null;
    onViewChange?: (viewId: string | null) => void;
    selectedFocusAreaId?: string | null;
    selectedElement?: Asset | null;
    onBackFromInspector?: () => void;
    scenarioId?: string;
    onFocusAreaSelect?: (focusAreaId: string | null) => void;
    onConnectedAssetsVisibilityChange?: (
        visible: boolean,
        dependents: Array<{ id: string; geom: string; type: { name: string } }>,
        providers: Array<{ id: string; geom: string; type: { name: string } }>,
    ) => void;
    focusAreas?: FocusArea[];
    isFocusAreasLoading?: boolean;
    isFocusAreasError?: boolean;
    exposureLayersData?: ExposureLayersResponse;
    isExposureLayersLoading?: boolean;
    isExposureLayersError?: boolean;
    constraintTypes?: ConstraintInterventionType[];
    isConstraintsLoading?: boolean;
    isConstraintsError?: boolean;
    resourceTypes?: ResourceType[];
    isResourcesLoading?: boolean;
    isResourcesError?: boolean;
    selectedResourceLocationId?: string | null;
    stockActionOpen?: boolean;
    onResourceLocationSelect?: (locationId: string) => void;
    onStockActionClose?: () => void;
};

const MapPanels = ({
    activeView,
    onViewChange,
    selectedFocusAreaId,
    selectedElement,
    onBackFromInspector,
    scenarioId,
    onFocusAreaSelect,
    onConnectedAssetsVisibilityChange,
    focusAreas,
    isFocusAreasLoading,
    isFocusAreasError,
    exposureLayersData,
    isExposureLayersLoading,
    isExposureLayersError,
    constraintTypes,
    isConstraintsLoading,
    isConstraintsError,
    resourceTypes,
    isResourcesLoading,
    isResourcesError,
    selectedResourceLocationId,
    stockActionOpen,
    onResourceLocationSelect,
    onStockActionClose,
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
                        exposureLayersData={exposureLayersData}
                        isLoading={isExposureLayersLoading}
                        isError={isExposureLayersError}
                    />
                );
            case 'utilities':
                return <UtilitiesView onClose={handleClosePanel} />;
            case 'focus-area':
                return (
                    <FocusAreaView
                        onClose={handleClosePanel}
                        scenarioId={scenarioId}
                        selectedFocusAreaId={selectedFocusAreaId}
                        onFocusAreaSelect={onFocusAreaSelect}
                        focusAreas={focusAreas}
                        isLoading={isFocusAreasLoading}
                        isError={isFocusAreasError}
                    />
                );
            case 'inspector':
                return (
                    <InspectorView
                        selectedElement={selectedElement ?? null}
                        onBack={onBackFromInspector}
                        onClose={handleClosePanel}
                        scenarioId={scenarioId}
                        onConnectedAssetsVisibilityChange={onConnectedAssetsVisibilityChange}
                    />
                );
            case 'constraints':
                return (
                    <ConstraintsView
                        onClose={handleClosePanel}
                        scenarioId={scenarioId}
                        constraintTypes={constraintTypes}
                        isLoading={isConstraintsLoading}
                        isError={isConstraintsError}
                    />
                );
            case 'resources':
                return (
                    <ResourcesView
                        onClose={handleClosePanel}
                        scenarioId={scenarioId}
                        resourceTypes={resourceTypes}
                        isLoading={isResourcesLoading ?? false}
                        isError={isResourcesError ?? false}
                        selectedLocationId={selectedResourceLocationId}
                        stockActionOpen={stockActionOpen}
                        onLocationSelect={onResourceLocationSelect}
                        onStockActionClose={onStockActionClose}
                    />
                );
            default:
                return null;
        }
    };

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
                    {FIXED_ITEMS.map((entry) => {
                        if (entry.type === 'separator') {
                            return <Divider key={entry.id} sx={{ my: 1, mx: 2 }} />;
                        }

                        return (
                            <MapPanelButton
                                key={entry.id}
                                label={entry.label}
                                icon={entry.icon}
                                isActive={activeView === entry.id}
                                onClick={() => handleItemClick(entry.id)}
                            />
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
