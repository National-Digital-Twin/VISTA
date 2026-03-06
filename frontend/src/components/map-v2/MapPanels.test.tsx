// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { ThemeProvider } from '@mui/material/styles';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import MapPanels from './MapPanels';
import theme from '@/theme';

vi.mock('./panels/AssetsView', () => ({
    default: ({ onClose }: { onClose: () => void }) => (
        <div data-testid="assets-view">
            <button onClick={onClose}>Close</button>
        </div>
    ),
}));

vi.mock('./panels/ExposureView', () => ({
    default: ({ onClose }: { onClose: () => void }) => (
        <div data-testid="exposure-view">
            <button onClick={onClose}>Close</button>
        </div>
    ),
}));

vi.mock('./panels/UtilitiesView', () => ({
    default: ({ onClose }: { onClose: () => void }) => (
        <div data-testid="utilities-view">
            <button onClick={onClose}>Close</button>
        </div>
    ),
}));

vi.mock('./panels/FocusAreaView', () => ({
    default: ({ onClose }: { onClose: () => void }) => (
        <div data-testid="focus-area-view">
            <button onClick={onClose}>Close</button>
        </div>
    ),
}));

vi.mock('./panels/InspectorView', () => ({
    default: ({ selectedElement, onBack, onClose }: { selectedElement: any; onBack?: () => void; onClose?: () => void }) => (
        <div data-testid="inspector-view">
            {selectedElement ? (
                <>
                    <div>Asset: {selectedElement?.uri || 'none'}</div>
                    {onBack && <button onClick={onBack}>Back</button>}
                    {onClose && (
                        <button onClick={onClose} data-testid="close-button">
                            Close
                        </button>
                    )}
                </>
            ) : (
                <div>Select an asset on the map to inspect its details.</div>
            )}
        </div>
    ),
}));

describe('MapPanels', () => {
    const defaultProps = {
        activeView: null,
        onViewChange: vi.fn(),
    };

    const renderWithTheme = (component: React.ReactElement) => {
        return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
    };

    describe('Rendering', () => {
        it('renders all panel buttons', () => {
            renderWithTheme(<MapPanels {...defaultProps} />);

            expect(screen.getByText('Focus area')).toBeInTheDocument();
            expect(screen.getByText('Assets')).toBeInTheDocument();
            expect(screen.getByText('Exposure')).toBeInTheDocument();
            expect(screen.getByText('Utilities')).toBeInTheDocument();
        });

        it('renders icons for all panels', () => {
            renderWithTheme(<MapPanels {...defaultProps} />);

            expect(screen.getByAltText('Focus area')).toBeInTheDocument();
            expect(screen.getByAltText('Assets')).toBeInTheDocument();
            expect(screen.getByAltText('Exposure')).toBeInTheDocument();
            expect(screen.getByAltText('Utilities')).toBeInTheDocument();
        });

        it('does not render panel content when no view is active', () => {
            renderWithTheme(<MapPanels {...defaultProps} />);

            expect(screen.queryByTestId('focus-area-view')).not.toBeInTheDocument();
            expect(screen.queryByTestId('assets-view')).not.toBeInTheDocument();
            expect(screen.queryByTestId('exposure-view')).not.toBeInTheDocument();
            expect(screen.queryByTestId('utilities-view')).not.toBeInTheDocument();
        });
    });

    describe('Panel Activation', () => {
        it('renders AssetsView when assets is active', () => {
            renderWithTheme(<MapPanels {...defaultProps} activeView="assets" />);

            expect(screen.getByTestId('assets-view')).toBeInTheDocument();
        });

        it('renders ExposureView when exposure is active', () => {
            renderWithTheme(<MapPanels {...defaultProps} activeView="exposure" />);

            expect(screen.getByTestId('exposure-view')).toBeInTheDocument();
        });

        it('renders FocusAreaView when focus-area is active', () => {
            renderWithTheme(<MapPanels {...defaultProps} activeView="focus-area" />);

            expect(screen.getByTestId('focus-area-view')).toBeInTheDocument();
        });

        it('renders UtilitiesView when utilities is active', () => {
            renderWithTheme(<MapPanels {...defaultProps} activeView="utilities" />);

            expect(screen.getByTestId('utilities-view')).toBeInTheDocument();
        });

        it('renders InspectorView when inspector is active', () => {
            renderWithTheme(<MapPanels {...defaultProps} activeView="inspector" />);

            expect(screen.getByTestId('inspector-view')).toBeInTheDocument();
            expect(screen.getByText('Select an asset on the map to inspect its details.')).toBeInTheDocument();
        });

        it('renders InspectorView with asset when inspector is active and asset is selected', () => {
            const mockAsset = { uri: 'https://example.com#asset1' } as any;
            renderWithTheme(<MapPanels {...defaultProps} activeView="inspector" selectedElement={mockAsset} onBackFromInspector={vi.fn()} />);

            expect(screen.getByTestId('inspector-view')).toBeInTheDocument();
            expect(screen.getByText('Asset: https://example.com#asset1')).toBeInTheDocument();
        });
    });

    describe('View Changes', () => {
        it('calls onViewChange when clicking a panel button', () => {
            const onViewChange = vi.fn();
            renderWithTheme(<MapPanels {...defaultProps} onViewChange={onViewChange} />);

            const assetsButton = screen.getByText('Assets').closest('div');
            if (assetsButton) {
                fireEvent.click(assetsButton);
            }

            expect(onViewChange).toHaveBeenCalledWith('assets');
        });

        it('closes panel when clicking active button again', () => {
            const onViewChange = vi.fn();
            renderWithTheme(<MapPanels {...defaultProps} activeView="assets" onViewChange={onViewChange} />);

            const assetsButton = screen.getByText('Assets').closest('div');
            if (assetsButton) {
                fireEvent.click(assetsButton);
            }

            expect(onViewChange).toHaveBeenCalledWith(null);
        });

        it('switches between panels', () => {
            const onViewChange = vi.fn();
            renderWithTheme(<MapPanels {...defaultProps} activeView="assets" onViewChange={onViewChange} />);

            const exposureButton = screen.getByText('Exposure').closest('div');
            if (exposureButton) {
                fireEvent.click(exposureButton);
            }

            expect(onViewChange).toHaveBeenCalledWith('exposure');
        });
    });

    describe('Panel Close', () => {
        it('closes panel when close button is clicked in AssetsView', () => {
            const onViewChange = vi.fn();
            renderWithTheme(<MapPanels {...defaultProps} activeView="assets" onViewChange={onViewChange} />);

            const closeButton = screen.getByText('Close');
            fireEvent.click(closeButton);

            expect(onViewChange).toHaveBeenCalledWith(null);
        });
    });

    describe('Active State Styling', () => {
        it('marks active button icon container as active', () => {
            renderWithTheme(<MapPanels {...defaultProps} activeView="assets" />);

            const assetsIcon = screen.getByAltText('Assets');
            const iconContainer = assetsIcon.closest('div');
            expect(iconContainer).toHaveStyle({ backgroundColor: 'rgb(212, 227, 255)' });
        });

        it('does not mark inactive button icon containers as active', () => {
            renderWithTheme(<MapPanels {...defaultProps} activeView="assets" />);

            const exposureIcon = screen.getByAltText('Exposure');
            const iconContainer = exposureIcon.closest('div');
            const bgColor = iconContainer?.style.backgroundColor || (iconContainer ? globalThis.getComputedStyle(iconContainer).backgroundColor : '');
            expect(bgColor === 'transparent' || bgColor === 'rgba(0, 0, 0, 0)' || bgColor === '').toBe(true);
        });
    });

    describe('Inspector Panel', () => {
        it('shows empty state when inspector is active with no asset', () => {
            renderWithTheme(<MapPanels {...defaultProps} activeView="inspector" />);

            expect(screen.getByText('Select an asset on the map to inspect its details.')).toBeInTheDocument();
        });

        it('calls onBackFromInspector when back button is clicked', () => {
            const mockAsset = { uri: 'https://example.com#asset1' } as any;
            const onBackFromInspector = vi.fn();
            renderWithTheme(<MapPanels {...defaultProps} activeView="inspector" selectedElement={mockAsset} onBackFromInspector={onBackFromInspector} />);

            const backButton = screen.getByText('Back');
            fireEvent.click(backButton);

            expect(onBackFromInspector).toHaveBeenCalledTimes(1);
        });

        it('allows navigation when inspector is active', () => {
            const mockAsset = { uri: 'https://example.com#asset1' } as any;
            const onViewChange = vi.fn();
            renderWithTheme(
                <MapPanels {...defaultProps} activeView="inspector" selectedElement={mockAsset} onViewChange={onViewChange} onBackFromInspector={vi.fn()} />,
            );

            const exposureButton = screen.getByText('Exposure').closest('div');
            if (exposureButton) {
                fireEvent.click(exposureButton);
            }

            expect(onViewChange).toHaveBeenCalledWith('exposure');
        });

        it('calls onViewChange when close button is clicked', () => {
            const onViewChange = vi.fn();
            const mockAsset = { uri: 'https://example.com#asset1' } as any;
            renderWithTheme(
                <MapPanels {...defaultProps} activeView="inspector" selectedElement={mockAsset} onViewChange={onViewChange} onBackFromInspector={vi.fn()} />,
            );

            const closeButton = screen.getByTestId('close-button');
            fireEvent.click(closeButton);

            expect(onViewChange).toHaveBeenCalledWith(null);
        });
    });
});
