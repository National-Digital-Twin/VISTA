import type { ReactElement } from 'react';
import { Box, Paper } from '@mui/material';
import MapPanelButton from './MapPanelButton';
import ScenarioView from './panels/ScenarioView';
import AssetsView from './panels/AssetsView';
import ExposureView from './panels/ExposureView';
import PolygonsView from './panels/PolygonsView';
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
        id: 'scenario',
        label: 'Scenario',
        icon: <img src="/icons/map-v2/scenario.svg" alt="Scenario" width={24} height={24} />,
    },
    {
        id: 'assets',
        label: 'Assets',
        icon: <img src="/icons/map-v2/assets.svg" alt="Assets" width={24} height={24} />,
    },
    {
        id: 'exposure',
        label: 'Exposure',
        icon: <img src="/icons/map-v2/exposure.svg" alt="Exposure" width={24} height={24} />,
    },
    {
        id: 'polygons',
        label: 'Polygons',
        icon: <img src="/icons/map-v2/polygon.svg" alt="Polygons" width={24} height={24} />,
    },
];

type MapPanelsProps = {
    activeView?: string | null;
    onViewChange?: (viewId: string | null) => void;
    selectedAssetTypes?: Record<string, boolean>;
    onAssetTypeToggle?: (assetType: string, enabled: boolean) => void;
    selectedExposureLayerIds?: Record<string, boolean>;
    onExposureLayerToggle?: (layerId: string, enabled: boolean) => void;
    selectedElement?: Asset | null;
    onBackFromAssetDetails?: () => void;
};

const MapPanels = ({
    activeView,
    onViewChange,
    selectedAssetTypes,
    onAssetTypeToggle,
    selectedExposureLayerIds,
    onExposureLayerToggle,
    selectedElement,
    onBackFromAssetDetails,
}: MapPanelsProps) => {
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
                return <AssetsView onClose={handleClosePanel} selectedAssetTypes={selectedAssetTypes} onAssetTypeToggle={onAssetTypeToggle} />;
            case 'exposure':
                return (
                    <ExposureView
                        onClose={handleClosePanel}
                        selectedExposureLayerIds={selectedExposureLayerIds}
                        onExposureLayerToggle={onExposureLayerToggle}
                    />
                );
            case 'polygons':
                return <PolygonsView onClose={handleClosePanel} />;
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
