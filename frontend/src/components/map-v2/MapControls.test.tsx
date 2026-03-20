// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MapStyleKey } from './constants';
import MapControls from './MapControls';
import theme from '@/theme';

const createTestQueryClient = () => {
    return new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });
};

const renderWithProviders = (component: React.ReactElement) => {
    const queryClient = createTestQueryClient();
    return render(
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>{component}</ThemeProvider>
        </QueryClientProvider>,
    );
};

vi.mock('./controls/CompassButton', () => ({
    default: ({ bearing }: { mapRef: any; bearing: number }) => <button data-testid="compass-button">Compass {bearing}</button>,
}));

vi.mock('./controls/ZoomInButton', () => ({
    default: () => <button data-testid="zoom-in-button">Zoom In</button>,
}));

vi.mock('./controls/ZoomOutButton', () => ({
    default: () => <button data-testid="zoom-out-button">Zoom Out</button>,
}));

vi.mock('./controls/SearchControl', () => ({
    default: () => <div data-testid="search-control">Search</div>,
}));

vi.mock('./controls/MapStyleButton', () => ({
    default: React.forwardRef(({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }, ref: any) => (
        <button ref={ref} data-testid="map-style-button" onClick={onToggle}>
            Map Style {isOpen ? 'Open' : 'Closed'}
        </button>
    )),
}));

vi.mock('./controls/AssetInfoButton', () => ({
    default: React.forwardRef(({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }, ref: any) => (
        <button ref={ref} data-testid="asset-info-button" onClick={onToggle}>
            Asset Info {isOpen ? 'Open' : 'Closed'}
        </button>
    )),
}));

vi.mock('./controls/panels/MapStylePanel', () => ({
    default: React.forwardRef(
        (
            {
                onStyleChange,
                isOpen,
                onToggle,
                showCoordinates,
                onShowCoordinatesChange,
                showCpsIcons,
                onShowCpsIconsChange,
            }: {
                onStyleChange: (s: MapStyleKey) => void;
                isOpen: boolean;
                onToggle: () => void;
                showCoordinates: boolean;
                onShowCoordinatesChange: (show: boolean) => void;
                showCpsIcons: boolean;
                onShowCpsIconsChange: (show: boolean) => void;
            },
            ref: any,
        ) =>
            isOpen ? (
                <div ref={ref} data-testid="map-style-panel">
                    <button onClick={() => onStyleChange('streets')}>Change Style</button>
                    <button onClick={onToggle}>Close</button>
                    <button data-testid="coordinates-toggle" data-checked={showCoordinates} onClick={() => onShowCoordinatesChange(!showCoordinates)}>
                        Coordinates
                    </button>
                    <button data-testid="cps-icons-toggle" data-checked={showCpsIcons} onClick={() => onShowCpsIconsChange(!showCpsIcons)}>
                        CPS Icons
                    </button>
                </div>
            ) : null,
    ),
}));

vi.mock('./controls/panels/AssetInfoPanel', () => ({
    default: React.forwardRef(({ open, assets, isFullScreen }: { open: boolean; assets: any[]; isFullScreen?: boolean }, ref: any) =>
        open ? (
            <div ref={ref} data-testid="asset-info-panel" data-fullscreen={isFullScreen}>
                {assets.length === 0 ? <div>No assets</div> : <div>Asset Table</div>}
            </div>
        ) : null,
    ),
}));

const createMockMapRef = (): React.RefObject<MapRef | null> => ({
    current: {
        getMap: () => ({}),
    } as MapRef,
});

describe('MapControls', () => {
    const defaultProps = {
        mapRef: createMockMapRef(),
        onClosePanels: vi.fn(),
        mapStyleKey: 'os' as MapStyleKey,
        onMapStyleChange: vi.fn(),
        mapStylePanelOpen: false,
        onToggleMapStylePanel: vi.fn(),
        assetInfoPanelOpen: false,
        onToggleAssetInfoPanel: vi.fn(),
        assets: [],
        showCoordinates: false,
        onShowCoordinatesChange: vi.fn(),
        showCpsIcons: false,
        onShowCpsIconsChange: vi.fn(),
        onSearchResultSelect: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('renders all control buttons', () => {
            renderWithProviders(<MapControls {...defaultProps} />);

            expect(screen.getByTestId('compass-button')).toBeInTheDocument();
            expect(screen.getByTestId('search-control')).toBeInTheDocument();
            expect(screen.getByTestId('zoom-in-button')).toBeInTheDocument();
            expect(screen.getByTestId('zoom-out-button')).toBeInTheDocument();
            expect(screen.getByTestId('map-style-button')).toBeInTheDocument();
            expect(screen.getByTestId('asset-info-button')).toBeInTheDocument();
        });

        it('renders control groups', () => {
            renderWithProviders(<MapControls {...defaultProps} />);

            expect(screen.getByRole('group', { name: 'View controls' })).toBeInTheDocument();
            expect(screen.getByRole('group', { name: 'Zoom controls' })).toBeInTheDocument();
            expect(screen.getByRole('group', { name: 'Asset information controls' })).toBeInTheDocument();
            expect(screen.getByRole('group', { name: 'Map style controls' })).toBeInTheDocument();
        });
    });

    describe('Panel Visibility', () => {
        it('shows map style panel when mapStylePanelOpen is true', () => {
            renderWithProviders(<MapControls {...defaultProps} mapStylePanelOpen={true} />);

            expect(screen.getByTestId('map-style-panel')).toBeInTheDocument();
        });

        it('shows asset info panel when assetInfoPanelOpen is true and no assets', () => {
            renderWithProviders(<MapControls {...defaultProps} assetInfoPanelOpen={true} assets={[]} />);

            expect(screen.getByTestId('asset-info-panel')).toBeInTheDocument();
            expect(screen.getByText('No assets')).toBeInTheDocument();
        });

        it('shows asset info panel when assetInfoPanelOpen is true and assets exist', () => {
            const mockAssets = [{ id: 'asset1', name: 'Test Asset' }] as any[];
            renderWithProviders(<MapControls {...defaultProps} assetInfoPanelOpen={true} assets={mockAssets} />);

            expect(screen.getByTestId('asset-info-panel')).toBeInTheDocument();
            expect(screen.getByText('Asset Table')).toBeInTheDocument();
        });

        it('renders asset info panel in full screen mode when assets exist', () => {
            const mockAssets = [{ id: 'asset1', name: 'Test Asset' }] as any[];
            renderWithProviders(<MapControls {...defaultProps} assetInfoPanelOpen={true} assets={mockAssets} />);

            const panel = screen.getByTestId('asset-info-panel');
            expect(panel).toHaveAttribute('data-fullscreen', 'true');
        });

        it('renders asset info panel in compact mode when no assets', () => {
            renderWithProviders(<MapControls {...defaultProps} assetInfoPanelOpen={true} assets={[]} />);

            const panel = screen.getByTestId('asset-info-panel');
            expect(panel).toHaveAttribute('data-fullscreen', 'false');
        });
    });

    describe('Button Interactions', () => {
        it('calls onToggleMapStylePanel when map style button is clicked', () => {
            const onToggleMapStylePanel = vi.fn();
            renderWithProviders(<MapControls {...defaultProps} onToggleMapStylePanel={onToggleMapStylePanel} />);

            const mapStyleButton = screen.getByTestId('map-style-button');
            fireEvent.click(mapStyleButton);

            expect(onToggleMapStylePanel).toHaveBeenCalledTimes(1);
        });

        it('calls onToggleAssetInfoPanel when asset info button is clicked', () => {
            const onToggleAssetInfoPanel = vi.fn();
            renderWithProviders(<MapControls {...defaultProps} onToggleAssetInfoPanel={onToggleAssetInfoPanel} />);

            const assetInfoButton = screen.getByTestId('asset-info-button');
            fireEvent.click(assetInfoButton);

            expect(onToggleAssetInfoPanel).toHaveBeenCalledTimes(1);
        });
    });

    describe('Map Style Panel', () => {
        it('calls onMapStyleChange when style is changed', () => {
            const onMapStyleChange = vi.fn();
            renderWithProviders(<MapControls {...defaultProps} mapStylePanelOpen={true} onMapStyleChange={onMapStyleChange} />);

            const changeStyleButton = screen.getByText('Change Style');
            fireEvent.click(changeStyleButton);

            expect(onMapStyleChange).toHaveBeenCalledWith('streets');
        });
    });

    describe('Click Outside Handling', () => {
        it('calls onClosePanels when clicking outside panels', () => {
            const onClosePanels = vi.fn();
            renderWithProviders(<MapControls {...defaultProps} mapStylePanelOpen={true} onClosePanels={onClosePanels} />);

            fireEvent.mouseDown(document.body);

            expect(onClosePanels).toHaveBeenCalled();
        });

        it('calls onClosePanels when clicking outside asset info panel', () => {
            const onClosePanels = vi.fn();
            renderWithProviders(<MapControls {...defaultProps} assetInfoPanelOpen={true} onClosePanels={onClosePanels} />);

            fireEvent.mouseDown(document.body);

            expect(onClosePanels).toHaveBeenCalled();
        });
    });

    describe('Coordinates and CPS Icons Toggles', () => {
        it('passes showCoordinates and onShowCoordinatesChange to MapStylePanel', () => {
            const onShowCoordinatesChange = vi.fn();
            renderWithProviders(
                <MapControls {...defaultProps} mapStylePanelOpen={true} showCoordinates={true} onShowCoordinatesChange={onShowCoordinatesChange} />,
            );

            const coordinatesToggle = screen.getByTestId('coordinates-toggle');
            expect(coordinatesToggle).toHaveAttribute('data-checked', 'true');

            fireEvent.click(coordinatesToggle);
            expect(onShowCoordinatesChange).toHaveBeenCalledWith(false);
        });

        it('passes showCpsIcons and onShowCpsIconsChange to MapStylePanel', () => {
            const onShowCpsIconsChange = vi.fn();
            renderWithProviders(<MapControls {...defaultProps} mapStylePanelOpen={true} showCpsIcons={true} onShowCpsIconsChange={onShowCpsIconsChange} />);

            const cpsIconsToggle = screen.getByTestId('cps-icons-toggle');
            expect(cpsIconsToggle).toHaveAttribute('data-checked', 'true');

            fireEvent.click(cpsIconsToggle);
            expect(onShowCpsIconsChange).toHaveBeenCalledWith(false);
        });
    });
});
