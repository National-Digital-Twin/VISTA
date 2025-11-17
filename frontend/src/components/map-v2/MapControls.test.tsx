import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MapRef } from 'react-map-gl/maplibre';
import type { MapStyleKey } from './constants';
import MapControls from './MapControls';
import { renderWithProviders } from '@/test-utils/test-helpers';

vi.mock('./controls/CompassButton', () => ({
    default: ({ bearing }: { mapRef: any; bearing: number }) => <button data-testid="compass-button">Compass {bearing}</button>,
}));

vi.mock('./controls/ZoomInButton', () => ({
    default: () => <button data-testid="zoom-in-button">Zoom In</button>,
}));

vi.mock('./controls/ZoomOutButton', () => ({
    default: () => <button data-testid="zoom-out-button">Zoom Out</button>,
}));

vi.mock('./controls/LegendButton', () => ({
    default: React.forwardRef(({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }, ref: any) => (
        <button ref={ref} data-testid="legend-button" onClick={onToggle}>
            Legend {isOpen ? 'Open' : 'Closed'}
        </button>
    )),
}));

vi.mock('./controls/MapStyleButton', () => ({
    default: React.forwardRef(({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }, ref: any) => (
        <button ref={ref} data-testid="map-style-button" onClick={onToggle}>
            Map Style {isOpen ? 'Open' : 'Closed'}
        </button>
    )),
}));

vi.mock('./controls/DrawPolygonButton', () => ({
    default: ({ isActive, onToggle }: { isActive: boolean; onToggle: () => void }) => (
        <button data-testid="draw-polygon-button" onClick={onToggle}>
            Draw {isActive ? 'Active' : 'Inactive'}
        </button>
    ),
}));

vi.mock('./controls/FloodWarningsButton', () => ({
    default: React.forwardRef(({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }, ref: any) => (
        <button ref={ref} data-testid="flood-warnings-button" onClick={onToggle}>
            Flood Warnings {isOpen ? 'Open' : 'Closed'}
        </button>
    )),
}));

vi.mock('./controls/panels/LegendPanel', () => ({
    default: React.forwardRef(({ open }: { open: boolean }, ref: any) =>
        open ? (
            <div ref={ref} data-testid="legend-panel">
                Legend Panel
            </div>
        ) : null,
    ),
}));

vi.mock('./controls/panels/MapStylePanel', () => ({
    default: React.forwardRef(
        ({ onStyleChange, isOpen, onToggle }: { onStyleChange: (s: MapStyleKey) => void; isOpen: boolean; onToggle: () => void }, ref: any) =>
            isOpen ? (
                <div ref={ref} data-testid="map-style-panel">
                    <button onClick={() => onStyleChange('streets')}>Change Style</button>
                    <button onClick={onToggle}>Close</button>
                </div>
            ) : null,
    ),
}));

vi.mock('./controls/panels/FloodWarningsPanel', () => ({
    default: React.forwardRef(({ open }: { open: boolean }, ref: any) =>
        open ? (
            <div ref={ref} data-testid="flood-warnings-panel">
                Flood Warnings Panel
            </div>
        ) : null,
    ),
}));

vi.mock('@/api/hydrology', () => ({
    fetchAllLiveStations: vi.fn().mockResolvedValue({ features: [] }),
}));

describe('MapControls', () => {
    const createMockMapRef = (): React.RefObject<MapRef | null> => ({
        current: {
            getMap: () => ({}),
        } as MapRef,
    });

    const defaultProps = {
        mapRef: createMockMapRef(),
        legendOpen: false,
        onToggleLegend: vi.fn(),
        floodWarningsOpen: false,
        onToggleFloodWarnings: vi.fn(),
        onClosePanels: vi.fn(),
        isDrawing: false,
        onToggleDrawing: vi.fn(),
        mapStyleKey: 'os' as MapStyleKey,
        onMapStyleChange: vi.fn(),
        mapStylePanelOpen: false,
        onToggleMapStylePanel: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('renders all control buttons', () => {
            renderWithProviders(<MapControls {...defaultProps} />);

            expect(screen.getByTestId('compass-button')).toBeInTheDocument();
            expect(screen.getByTestId('zoom-in-button')).toBeInTheDocument();
            expect(screen.getByTestId('zoom-out-button')).toBeInTheDocument();
            expect(screen.getByTestId('legend-button')).toBeInTheDocument();
            expect(screen.getByTestId('map-style-button')).toBeInTheDocument();
            expect(screen.getByTestId('draw-polygon-button')).toBeInTheDocument();
            expect(screen.getByTestId('flood-warnings-button')).toBeInTheDocument();
        });

        it('renders control groups', () => {
            renderWithProviders(<MapControls {...defaultProps} />);

            expect(screen.getByRole('group', { name: 'Flood warnings controls' })).toBeInTheDocument();
            expect(screen.getByRole('group', { name: 'View controls' })).toBeInTheDocument();
            expect(screen.getByRole('group', { name: 'Zoom controls' })).toBeInTheDocument();
            expect(screen.getByRole('group', { name: 'Drawing controls' })).toBeInTheDocument();
            expect(screen.getByRole('group', { name: 'Map style controls' })).toBeInTheDocument();
            expect(screen.getByRole('group', { name: 'Map legend controls' })).toBeInTheDocument();
        });
    });

    describe('Panel Visibility', () => {
        it('shows legend panel when legendOpen is true', () => {
            renderWithProviders(<MapControls {...defaultProps} legendOpen={true} />);

            expect(screen.getByTestId('legend-panel')).toBeInTheDocument();
        });

        it('hides legend panel when legendOpen is false', () => {
            renderWithProviders(<MapControls {...defaultProps} legendOpen={false} />);

            expect(screen.queryByTestId('legend-panel')).not.toBeInTheDocument();
        });

        it('shows map style panel when mapStylePanelOpen is true', () => {
            renderWithProviders(<MapControls {...defaultProps} mapStylePanelOpen={true} />);

            expect(screen.getByTestId('map-style-panel')).toBeInTheDocument();
        });

        it('shows flood warnings panel when floodWarningsOpen is true', () => {
            renderWithProviders(<MapControls {...defaultProps} floodWarningsOpen={true} />);

            expect(screen.getByTestId('flood-warnings-panel')).toBeInTheDocument();
        });
    });

    describe('Button Interactions', () => {
        it('calls onToggleLegend when legend button is clicked', () => {
            const onToggleLegend = vi.fn();
            renderWithProviders(<MapControls {...defaultProps} onToggleLegend={onToggleLegend} />);

            const legendButton = screen.getByTestId('legend-button');
            fireEvent.click(legendButton);

            expect(onToggleLegend).toHaveBeenCalledTimes(1);
        });

        it('calls onToggleMapStylePanel when map style button is clicked', () => {
            const onToggleMapStylePanel = vi.fn();
            renderWithProviders(<MapControls {...defaultProps} onToggleMapStylePanel={onToggleMapStylePanel} />);

            const mapStyleButton = screen.getByTestId('map-style-button');
            fireEvent.click(mapStyleButton);

            expect(onToggleMapStylePanel).toHaveBeenCalledTimes(1);
        });

        it('calls onToggleFloodWarnings when flood warnings button is clicked', () => {
            const onToggleFloodWarnings = vi.fn();
            renderWithProviders(<MapControls {...defaultProps} onToggleFloodWarnings={onToggleFloodWarnings} />);

            const floodWarningsButton = screen.getByTestId('flood-warnings-button');
            fireEvent.click(floodWarningsButton);

            expect(onToggleFloodWarnings).toHaveBeenCalledTimes(1);
        });

        it('calls onToggleDrawing when draw polygon button is clicked', () => {
            const onToggleDrawing = vi.fn();
            renderWithProviders(<MapControls {...defaultProps} onToggleDrawing={onToggleDrawing} />);

            const drawPolygonButton = screen.getByTestId('draw-polygon-button');
            fireEvent.click(drawPolygonButton);

            expect(onToggleDrawing).toHaveBeenCalledTimes(1);
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
            renderWithProviders(<MapControls {...defaultProps} legendOpen={true} onClosePanels={onClosePanels} />);

            fireEvent.mouseDown(document.body);
        });
    });
});
