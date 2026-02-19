import { Box, styled } from '@mui/material';
import { useEffect, useRef } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import type { ViewState } from 'react-map-gl';
import type { RefObject } from 'react';
import CompassButton from './controls/CompassButton';
import ZoomInButton from './controls/ZoomInButton';
import ZoomOutButton from './controls/ZoomOutButton';
import SearchControl from './controls/SearchControl';
import AssetInfoButton from './controls/AssetInfoButton';
import MapStyleButton from './controls/MapStyleButton';
import AssetInfoPanel from './controls/panels/AssetInfoPanel';
import MapStylePanel from './controls/panels/MapStylePanel';
import type { SearchSelection } from './controls/SearchControl';
import type { MapStyleKey } from './constants';
import type { Asset } from '@/api/assets-by-type';
import type { AssetCategory } from '@/api/asset-categories';

const ControlsContainer = styled(Box)({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '1rem',
    position: 'absolute',
    right: '1rem',
    top: '1rem',
    zIndex: 2,
});

const TopRightControls = styled(Box)({
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.5rem',
});

const ControlGroup = styled('fieldset')(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[2],
    display: 'flex',
    flexDirection: 'column',
    width: 'fit-content',
    border: 'none',
    margin: 0,
    padding: 0,
}));

const ControlDivider = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.divider,
    height: 2,
    width: '100%',
}));

type MapControlsProps = {
    mapRef: RefObject<MapRef | null>;
    onClosePanels: () => void;
    mapStyleKey: MapStyleKey;
    onMapStyleChange: (style: MapStyleKey) => void;
    mapStylePanelOpen: boolean;
    onToggleMapStylePanel: () => void;
    assetInfoPanelOpen: boolean;
    onToggleAssetInfoPanel: () => void;
    assets: Asset[];
    assetCategories?: AssetCategory[];
    viewState?: ViewState;
    showCoordinates: boolean;
    onShowCoordinatesChange: (show: boolean) => void;
    showCpsIcons: boolean;
    onShowCpsIconsChange: (show: boolean) => void;
    onSearchResultSelect: (result: SearchSelection) => void;
};

const MapControls = ({
    mapRef,
    onClosePanels,
    mapStyleKey,
    onMapStyleChange,
    mapStylePanelOpen,
    onToggleMapStylePanel,
    assetInfoPanelOpen,
    onToggleAssetInfoPanel,
    assets,
    assetCategories,
    viewState,
    showCoordinates,
    onShowCoordinatesChange,
    showCpsIcons,
    onShowCpsIconsChange,
    onSearchResultSelect,
}: MapControlsProps) => {
    const mapStylePanelRef = useRef<HTMLDivElement>(null);
    const mapStyleButtonRef = useRef<HTMLButtonElement>(null);
    const assetInfoPanelRef = useRef<HTMLDivElement>(null);
    const assetInfoButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!mapStylePanelOpen && !assetInfoPanelOpen) {
            return;
        }

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;

            if (mapStylePanelRef.current?.contains(target)) {
                return;
            }

            if (mapStyleButtonRef.current?.contains(target)) {
                return;
            }

            if (assetInfoPanelRef.current?.contains(target)) {
                return;
            }

            if (assetInfoButtonRef.current?.contains(target)) {
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
    }, [mapStylePanelOpen, assetInfoPanelOpen, onClosePanels]);

    return (
        <>
            <ControlsContainer>
                <TopRightControls>
                    <SearchControl onResultSelect={onSearchResultSelect} />
                    <ControlGroup aria-label="View controls">
                        <legend style={{ display: 'none' }}>View controls</legend>
                        <CompassButton mapRef={mapRef} bearing={viewState?.bearing ?? 0} />
                    </ControlGroup>
                </TopRightControls>

                <ControlGroup aria-label="Zoom controls">
                    <legend style={{ display: 'none' }}>Zoom controls</legend>
                    <ZoomInButton mapRef={mapRef} />
                    <ControlDivider />
                    <ZoomOutButton mapRef={mapRef} />
                </ControlGroup>

                <ControlGroup aria-label="Asset information controls" sx={{ position: 'relative' }}>
                    <legend style={{ display: 'none' }}>Asset information controls</legend>
                    <AssetInfoButton ref={assetInfoButtonRef} isOpen={assetInfoPanelOpen} onToggle={onToggleAssetInfoPanel} />
                    {assetInfoPanelOpen && assets.length === 0 && (
                        <Box sx={{ position: 'absolute', top: 0, right: 'calc(100% + 1rem)' }}>
                            <AssetInfoPanel
                                ref={assetInfoPanelRef}
                                open={assetInfoPanelOpen}
                                assets={assets}
                                assetCategories={assetCategories}
                                isFullScreen={false}
                            />
                        </Box>
                    )}
                </ControlGroup>

                <ControlGroup aria-label="Map style controls" sx={{ position: 'relative' }}>
                    <legend style={{ display: 'none' }}>Map style controls</legend>
                    <MapStyleButton ref={mapStyleButtonRef} isOpen={mapStylePanelOpen} onToggle={onToggleMapStylePanel} />
                    <Box sx={{ position: 'absolute', top: 0, right: 'calc(100% + 1rem)' }}>
                        <MapStylePanel
                            ref={mapStylePanelRef}
                            currentStyle={mapStyleKey}
                            onStyleChange={onMapStyleChange}
                            isOpen={mapStylePanelOpen}
                            onToggle={onToggleMapStylePanel}
                            showCoordinates={showCoordinates}
                            onShowCoordinatesChange={onShowCoordinatesChange}
                            showCpsIcons={showCpsIcons}
                            onShowCpsIconsChange={onShowCpsIconsChange}
                        />
                    </Box>
                </ControlGroup>
            </ControlsContainer>

            {assetInfoPanelOpen && assets.length > 0 && (
                <Box
                    sx={{
                        position: 'absolute',
                        left: '1rem',
                        right: '5rem',
                        top: '1rem',
                        bottom: '1rem',
                        zIndex: 2,
                    }}
                >
                    <AssetInfoPanel ref={assetInfoPanelRef} open={assetInfoPanelOpen} assets={assets} assetCategories={assetCategories} isFullScreen={true} />
                </Box>
            )}
        </>
    );
};

export default MapControls;
