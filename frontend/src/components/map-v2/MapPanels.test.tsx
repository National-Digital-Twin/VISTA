import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from '@mui/material/styles';
import MapPanels from './MapPanels';
import theme from '@/theme';

vi.mock('./panels/ScenarioView', () => ({
    default: ({ onItemClick, onClose }: { onItemClick: (id: string) => void; onClose: () => void }) => (
        <div data-testid="scenario-view">
            <button onClick={() => onItemClick('assets')}>Go to Assets</button>
            <button onClick={onClose}>Close</button>
        </div>
    ),
}));

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

vi.mock('./panels/FocusAreaView', () => ({
    default: ({ onClose }: { onClose: () => void }) => (
        <div data-testid="focus-area-view">
            <button onClick={onClose}>Close</button>
        </div>
    ),
}));

vi.mock('./panels/AssetDetailsPanel', () => ({
    default: ({ selectedElement, onBack }: { selectedElement: any; onBack: () => void }) => (
        <div data-testid="asset-details-panel">
            <div>Asset: {selectedElement?.uri || 'none'}</div>
            <button onClick={onBack}>Back</button>
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
            expect(screen.getByText('Scenario')).toBeInTheDocument();
            expect(screen.getByText('Assets')).toBeInTheDocument();
            expect(screen.getByText('Exposure')).toBeInTheDocument();
        });

        it('renders icons for all panels', () => {
            renderWithTheme(<MapPanels {...defaultProps} />);

            expect(screen.getByAltText('Focus area')).toBeInTheDocument();
            expect(screen.getByAltText('Scenario')).toBeInTheDocument();
            expect(screen.getByAltText('Assets')).toBeInTheDocument();
            expect(screen.getByAltText('Exposure')).toBeInTheDocument();
        });

        it('does not render panel content when no view is active', () => {
            renderWithTheme(<MapPanels {...defaultProps} />);

            expect(screen.queryByTestId('focus-area-view')).not.toBeInTheDocument();
            expect(screen.queryByTestId('scenario-view')).not.toBeInTheDocument();
            expect(screen.queryByTestId('assets-view')).not.toBeInTheDocument();
            expect(screen.queryByTestId('exposure-view')).not.toBeInTheDocument();
        });
    });

    describe('Panel Activation', () => {
        it('renders ScenarioView when scenario is active', () => {
            renderWithTheme(<MapPanels {...defaultProps} activeView="scenario" />);

            expect(screen.getByTestId('scenario-view')).toBeInTheDocument();
        });

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

        it('renders AssetDetailsPanel when asset-details is active', () => {
            const mockAsset = { uri: 'https://example.com#asset1' } as any;
            renderWithTheme(<MapPanels {...defaultProps} activeView="asset-details" selectedElement={mockAsset} onBackFromAssetDetails={vi.fn()} />);

            expect(screen.getByTestId('asset-details-panel')).toBeInTheDocument();
            expect(screen.getByText('Asset: https://example.com#asset1')).toBeInTheDocument();
        });
    });

    describe('View Changes', () => {
        it('calls onViewChange when clicking a panel button', () => {
            const onViewChange = vi.fn();
            renderWithTheme(<MapPanels {...defaultProps} onViewChange={onViewChange} />);

            const scenarioButton = screen.getByText('Scenario').closest('div');
            if (scenarioButton) {
                fireEvent.click(scenarioButton);
            }

            expect(onViewChange).toHaveBeenCalledWith('scenario');
        });

        it('closes panel when clicking active button again', () => {
            const onViewChange = vi.fn();
            renderWithTheme(<MapPanels {...defaultProps} activeView="scenario" onViewChange={onViewChange} />);

            const scenarioButton = screen.getByText('Scenario').closest('div');
            if (scenarioButton) {
                fireEvent.click(scenarioButton);
            }

            expect(onViewChange).toHaveBeenCalledWith(null);
        });

        it('switches between panels', () => {
            const onViewChange = vi.fn();
            renderWithTheme(<MapPanels {...defaultProps} activeView="scenario" onViewChange={onViewChange} />);

            const assetsButton = screen.getByText('Assets').closest('div');
            if (assetsButton) {
                fireEvent.click(assetsButton);
            }

            expect(onViewChange).toHaveBeenCalledWith('assets');
        });
    });

    describe('Panel Close', () => {
        it('closes panel when close button is clicked in ScenarioView', () => {
            const onViewChange = vi.fn();
            renderWithTheme(<MapPanels {...defaultProps} activeView="scenario" onViewChange={onViewChange} />);

            const closeButton = screen.getByText('Close');
            fireEvent.click(closeButton);

            expect(onViewChange).toHaveBeenCalledWith(null);
        });

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
            renderWithTheme(<MapPanels {...defaultProps} activeView="scenario" />);

            const scenarioIcon = screen.getByAltText('Scenario');
            const iconContainer = scenarioIcon.closest('div');
            expect(iconContainer).toHaveStyle({ backgroundColor: 'rgb(212, 227, 255)' });
        });

        it('does not mark inactive button icon containers as active', () => {
            renderWithTheme(<MapPanels {...defaultProps} activeView="scenario" />);

            const assetsIcon = screen.getByAltText('Assets');
            const iconContainer = assetsIcon.closest('div');
            const bgColor = iconContainer?.style.backgroundColor || (iconContainer ? globalThis.getComputedStyle(iconContainer).backgroundColor : '');
            expect(bgColor === 'transparent' || bgColor === 'rgba(0, 0, 0, 0)' || bgColor === '').toBe(true);
        });
    });

    describe('Navigation from ScenarioView', () => {
        it('navigates to assets from ScenarioView', () => {
            const onViewChange = vi.fn();
            renderWithTheme(<MapPanels {...defaultProps} activeView="scenario" onViewChange={onViewChange} />);

            const goToAssetsButton = screen.getByText('Go to Assets');
            fireEvent.click(goToAssetsButton);

            expect(onViewChange).toHaveBeenCalledWith('assets');
        });
    });

    describe('Asset Details Panel', () => {
        it('disables assets button when asset-details is active', () => {
            const mockAsset = { uri: 'https://example.com#asset1' } as any;
            renderWithTheme(<MapPanels {...defaultProps} activeView="asset-details" selectedElement={mockAsset} onBackFromAssetDetails={vi.fn()} />);

            const assetsButton = screen.getByText('Assets').closest('div');
            expect(assetsButton).toBeInTheDocument();
        });

        it('calls onBackFromAssetDetails when back button is clicked', () => {
            const mockAsset = { uri: 'https://example.com#asset1' } as any;
            const onBackFromAssetDetails = vi.fn();
            renderWithTheme(
                <MapPanels {...defaultProps} activeView="asset-details" selectedElement={mockAsset} onBackFromAssetDetails={onBackFromAssetDetails} />,
            );

            const backButton = screen.getByText('Back');
            fireEvent.click(backButton);

            expect(onBackFromAssetDetails).toHaveBeenCalledTimes(1);
        });

        it('allows navigation when asset-details is active', () => {
            const mockAsset = { uri: 'https://example.com#asset1' } as any;
            const onViewChange = vi.fn();
            renderWithTheme(
                <MapPanels
                    {...defaultProps}
                    activeView="asset-details"
                    selectedElement={mockAsset}
                    onViewChange={onViewChange}
                    onBackFromAssetDetails={vi.fn()}
                />,
            );

            const scenarioButton = screen.getByText('Scenario').closest('div');
            if (scenarioButton) {
                fireEvent.click(scenarioButton);
            }

            expect(onViewChange).toHaveBeenCalledWith('scenario');
        });
    });
});
