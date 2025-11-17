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

vi.mock('./panels/PolygonsView', () => ({
    default: ({ onClose }: { onClose: () => void }) => (
        <div data-testid="polygons-view">
            <button onClick={onClose}>Close</button>
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

            expect(screen.getByText('Scenario')).toBeInTheDocument();
            expect(screen.getByText('Assets')).toBeInTheDocument();
            expect(screen.getByText('Exposure')).toBeInTheDocument();
            expect(screen.getByText('Polygons')).toBeInTheDocument();
        });

        it('renders icons for all panels', () => {
            renderWithTheme(<MapPanels {...defaultProps} />);

            expect(screen.getByAltText('Scenario')).toBeInTheDocument();
            expect(screen.getByAltText('Assets')).toBeInTheDocument();
            expect(screen.getByAltText('Exposure')).toBeInTheDocument();
            expect(screen.getByAltText('Polygons')).toBeInTheDocument();
        });

        it('does not render panel content when no view is active', () => {
            renderWithTheme(<MapPanels {...defaultProps} />);

            expect(screen.queryByTestId('scenario-view')).not.toBeInTheDocument();
            expect(screen.queryByTestId('assets-view')).not.toBeInTheDocument();
            expect(screen.queryByTestId('exposure-view')).not.toBeInTheDocument();
            expect(screen.queryByTestId('polygons-view')).not.toBeInTheDocument();
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

        it('renders PolygonsView when polygons is active', () => {
            renderWithTheme(<MapPanels {...defaultProps} activeView="polygons" />);

            expect(screen.getByTestId('polygons-view')).toBeInTheDocument();
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
        it('marks active button as active', () => {
            renderWithTheme(<MapPanels {...defaultProps} activeView="scenario" />);

            const scenarioButton = screen.getByText('Scenario').closest('div');
            expect(scenarioButton).toHaveStyle({ backgroundColor: 'rgb(212, 227, 255)' });
        });

        it('does not mark inactive buttons as active', () => {
            renderWithTheme(<MapPanels {...defaultProps} activeView="scenario" />);

            const assetsButton = screen.getByText('Assets').closest('div');
            const bgColor = assetsButton?.style.backgroundColor || window.getComputedStyle(assetsButton!).backgroundColor;
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
});
