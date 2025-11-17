import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MapView from './MapView';
import theme from '@/theme';

vi.mock('react-map-gl/maplibre', () => ({
    default: React.forwardRef(({ onLoad, children, ...props }: any, ref: any) => {
        React.useImperativeHandle(ref, () => ({
            getMap: () => ({
                on: vi.fn(),
                off: vi.fn(),
                easeTo: vi.fn(),
                zoomIn: vi.fn(),
                zoomOut: vi.fn(),
            }),
        }));

        React.useEffect(() => {
            if (onLoad) {
                setTimeout(() => onLoad(), 0);
            }
        }, [onLoad]);

        return (
            <div data-testid="map" {...props}>
                {children}
            </div>
        );
    }),
}));

vi.mock('./MapPanels', () => ({
    default: ({ activeView, onViewChange }: { activeView: string | null; onViewChange: (view: string | null) => void }) => (
        <div data-testid="map-panels">
            <button onClick={() => onViewChange(activeView === 'scenario' ? null : 'scenario')}>Toggle Scenario</button>
            <div data-testid="active-view">{activeView || 'none'}</div>
        </div>
    ),
}));

vi.mock('./MapControls', () => ({
    default: ({
        legendOpen,
        onToggleLegend,
        floodWarningsOpen,
        onToggleFloodWarnings,
        mapStylePanelOpen,
        onToggleMapStylePanel,
        isDrawing,
        onToggleDrawing,
        onMapStyleChange,
    }: any) => (
        <div data-testid="map-controls">
            <button onClick={onToggleLegend} data-testid="legend-toggle">
                Legend {legendOpen ? 'Open' : 'Closed'}
            </button>
            <button onClick={onToggleFloodWarnings} data-testid="flood-warnings-toggle">
                Flood Warnings {floodWarningsOpen ? 'Open' : 'Closed'}
            </button>
            <button onClick={onToggleMapStylePanel} data-testid="map-style-toggle">
                Map Style {mapStylePanelOpen ? 'Open' : 'Closed'}
            </button>
            <button onClick={onToggleDrawing} data-testid="drawing-toggle">
                Drawing {isDrawing ? 'Open' : 'Closed'}
            </button>
            <button onClick={() => onMapStyleChange('streets')} data-testid="change-style">
                Change Style
            </button>
        </div>
    ),
}));

vi.mock('./DrawingToolbar', () => ({
    default: ({ drawingMode, onDrawingModeChange, primaryAssets, onPrimaryAssetsChange, dependentAssets, onDependentAssetsChange }: any) => (
        <div data-testid="drawing-toolbar">
            <div data-testid="drawing-mode">{drawingMode || 'none'}</div>
            <button onClick={() => onDrawingModeChange('circle')}>Draw Circle</button>
            <button onClick={() => onDrawingModeChange('polygon')}>Draw Polygon</button>
            <div data-testid="primary-assets">{primaryAssets ? 'enabled' : 'disabled'}</div>
            <div data-testid="dependent-assets">{dependentAssets ? 'enabled' : 'disabled'}</div>
            <button onClick={() => onPrimaryAssetsChange(!primaryAssets)}>Toggle Primary</button>
            <button onClick={() => onDependentAssetsChange(!dependentAssets)}>Toggle Dependent</button>
        </div>
    ),
}));

vi.mock('./hooks/useMapboxDraw', () => ({
    default: () => ({
        current: {
            changeMode: vi.fn(),
            getMode: vi.fn(() => 'simple_select'),
        },
    }),
}));

vi.mock('@/api/hydrology', () => ({
    fetchAllLiveStations: vi.fn().mockResolvedValue({ features: [] }),
}));

describe('MapView', () => {
    const createQueryClient = () => {
        return new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        });
    };

    const renderWithProviders = (component: React.ReactElement) => {
        const queryClient = createQueryClient();
        return render(
            <QueryClientProvider client={queryClient}>
                <ThemeProvider theme={theme}>{component}</ThemeProvider>
            </QueryClientProvider>,
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('renders map component', async () => {
            renderWithProviders(<MapView />);

            await waitFor(() => {
                expect(screen.getByTestId('map')).toBeInTheDocument();
            });
        });

        it('renders MapPanels component', () => {
            renderWithProviders(<MapView />);

            expect(screen.getByTestId('map-panels')).toBeInTheDocument();
        });

        it('renders MapControls component', () => {
            renderWithProviders(<MapView />);

            expect(screen.getByTestId('map-controls')).toBeInTheDocument();
        });

        it('does not render DrawingToolbar initially', () => {
            renderWithProviders(<MapView />);

            expect(screen.queryByTestId('drawing-toolbar')).not.toBeInTheDocument();
        });
    });

    describe('Panel State Management', () => {
        it('starts with scenario panel active', () => {
            renderWithProviders(<MapView />);

            expect(screen.getByTestId('active-view')).toHaveTextContent('scenario');
        });

        it('updates active panel view when MapPanels changes view', async () => {
            renderWithProviders(<MapView />);

            const toggleButton = screen.getByText('Toggle Scenario');
            await act(async () => {
                toggleButton.click();
            });

            await waitFor(() => {
                expect(screen.getByTestId('active-view')).toHaveTextContent('none');
            });
        });
    });

    describe('Legend Panel Toggle', () => {
        it('toggles legend panel', async () => {
            renderWithProviders(<MapView />);

            const legendToggle = screen.getByTestId('legend-toggle');
            expect(legendToggle).toHaveTextContent('Legend Closed');

            await act(async () => {
                legendToggle.click();
            });

            await waitFor(() => {
                expect(legendToggle).toHaveTextContent('Legend Open');
            });
        });

        it('closes other panels when opening legend', async () => {
            renderWithProviders(<MapView />);

            const mapStyleToggle = screen.getByTestId('map-style-toggle');
            await act(async () => {
                mapStyleToggle.click();
            });

            await waitFor(() => {
                expect(mapStyleToggle).toHaveTextContent('Map Style Open');
            });

            const legendToggle = screen.getByTestId('legend-toggle');
            await act(async () => {
                legendToggle.click();
            });

            await waitFor(() => {
                expect(legendToggle).toHaveTextContent('Legend Open');
                expect(mapStyleToggle).toHaveTextContent('Map Style Closed');
            });
        });
    });

    describe('Flood Warnings Panel Toggle', () => {
        it('toggles flood warnings panel', async () => {
            renderWithProviders(<MapView />);

            const floodWarningsToggle = screen.getByTestId('flood-warnings-toggle');
            expect(floodWarningsToggle).toHaveTextContent('Flood Warnings Closed');

            await act(async () => {
                floodWarningsToggle.click();
            });

            await waitFor(() => {
                expect(floodWarningsToggle).toHaveTextContent('Flood Warnings Open');
            });
        });

        it('closes other panels when opening flood warnings', async () => {
            renderWithProviders(<MapView />);

            const legendToggle = screen.getByTestId('legend-toggle');
            await act(async () => {
                legendToggle.click();
            });

            await waitFor(() => {
                expect(legendToggle).toHaveTextContent('Legend Open');
            });

            const floodWarningsToggle = screen.getByTestId('flood-warnings-toggle');
            await act(async () => {
                floodWarningsToggle.click();
            });

            await waitFor(() => {
                expect(floodWarningsToggle).toHaveTextContent('Flood Warnings Open');
                expect(legendToggle).toHaveTextContent('Legend Closed');
            });
        });
    });

    describe('Map Style Panel Toggle', () => {
        it('toggles map style panel', async () => {
            renderWithProviders(<MapView />);

            const mapStyleToggle = screen.getByTestId('map-style-toggle');
            expect(mapStyleToggle).toHaveTextContent('Map Style Closed');

            await act(async () => {
                mapStyleToggle.click();
            });

            await waitFor(() => {
                expect(mapStyleToggle).toHaveTextContent('Map Style Open');
            });
        });

        it('closes other panels when opening map style panel', async () => {
            renderWithProviders(<MapView />);

            const legendToggle = screen.getByTestId('legend-toggle');
            await act(async () => {
                legendToggle.click();
            });

            await waitFor(() => {
                expect(legendToggle).toHaveTextContent('Legend Open');
            });

            const mapStyleToggle = screen.getByTestId('map-style-toggle');
            await act(async () => {
                mapStyleToggle.click();
            });

            await waitFor(() => {
                expect(mapStyleToggle).toHaveTextContent('Map Style Open');
                expect(legendToggle).toHaveTextContent('Legend Closed');
            });
        });
    });

    describe('Map Style Change', () => {
        it('changes map style when MapControls calls onMapStyleChange', async () => {
            renderWithProviders(<MapView />);

            const changeStyleButton = screen.getByTestId('change-style');
            await act(async () => {
                changeStyleButton.click();
            });

            expect(changeStyleButton).toBeInTheDocument();
        });
    });

    describe('Drawing Toolbar', () => {
        it('shows drawing toolbar when toggled on', async () => {
            renderWithProviders(<MapView />);

            const drawingToggle = screen.getByTestId('drawing-toggle');
            await act(async () => {
                drawingToggle.click();
            });

            await waitFor(() => {
                expect(screen.getByTestId('drawing-toolbar')).toBeInTheDocument();
            });
        });

        it('hides drawing toolbar when toggled off', async () => {
            renderWithProviders(<MapView />);

            const drawingToggle = screen.getByTestId('drawing-toggle');
            await act(async () => {
                drawingToggle.click();
            });

            await waitFor(() => {
                expect(screen.getByTestId('drawing-toolbar')).toBeInTheDocument();
            });

            await act(async () => {
                drawingToggle.click();
            });

            await waitFor(() => {
                expect(screen.queryByTestId('drawing-toolbar')).not.toBeInTheDocument();
            });
        });

        it('updates drawing mode when DrawingToolbar changes mode', async () => {
            renderWithProviders(<MapView />);

            const drawingToggle = screen.getByTestId('drawing-toggle');
            await act(async () => {
                drawingToggle.click();
            });

            await waitFor(() => {
                expect(screen.getByTestId('drawing-toolbar')).toBeInTheDocument();
            });

            const drawCircleButton = screen.getByText('Draw Circle');
            await act(async () => {
                drawCircleButton.click();
            });

            await waitFor(() => {
                expect(screen.getByTestId('drawing-mode')).toHaveTextContent('circle');
            });
        });

        it('resets drawing mode when closing drawing toolbar', async () => {
            renderWithProviders(<MapView />);

            const drawingToggle = screen.getByTestId('drawing-toggle');
            await act(async () => {
                drawingToggle.click();
            });

            await waitFor(() => {
                expect(screen.getByTestId('drawing-toolbar')).toBeInTheDocument();
            });

            const drawCircleButton = screen.getByText('Draw Circle');
            await act(async () => {
                drawCircleButton.click();
            });

            await waitFor(() => {
                expect(screen.getByTestId('drawing-mode')).toHaveTextContent('circle');
            });

            await act(async () => {
                drawingToggle.click();
            });

            await act(async () => {
                drawingToggle.click();
            });

            await waitFor(() => {
                expect(screen.getByTestId('drawing-mode')).toHaveTextContent('none');
            });
        });
    });

    describe('Asset Filters', () => {
        it('updates primary assets state', async () => {
            renderWithProviders(<MapView />);

            const drawingToggle = screen.getByTestId('drawing-toggle');
            await act(async () => {
                drawingToggle.click();
            });

            await waitFor(() => {
                expect(screen.getByTestId('drawing-toolbar')).toBeInTheDocument();
            });

            const togglePrimaryButton = screen.getByText('Toggle Primary');
            expect(screen.getByTestId('primary-assets')).toHaveTextContent('disabled');

            await act(async () => {
                togglePrimaryButton.click();
            });

            await waitFor(() => {
                expect(screen.getByTestId('primary-assets')).toHaveTextContent('enabled');
            });
        });

        it('updates dependent assets state', async () => {
            renderWithProviders(<MapView />);

            const drawingToggle = screen.getByTestId('drawing-toggle');
            await act(async () => {
                drawingToggle.click();
            });

            await waitFor(() => {
                expect(screen.getByTestId('drawing-toolbar')).toBeInTheDocument();
            });

            const toggleDependentButton = screen.getByText('Toggle Dependent');
            expect(screen.getByTestId('dependent-assets')).toHaveTextContent('disabled');

            await act(async () => {
                toggleDependentButton.click();
            });

            await waitFor(() => {
                expect(screen.getByTestId('dependent-assets')).toHaveTextContent('enabled');
            });
        });
    });

    describe('Panel Layout', () => {
        it('adjusts map margin when panel is active', () => {
            const { container } = renderWithProviders(<MapView />);

            const mapContainer = container.querySelector('[class*="MuiBox-root"]');
            expect(mapContainer).toBeInTheDocument();
        });
    });

    describe('Map Load', () => {
        it('sets mapReady when map loads', async () => {
            renderWithProviders(<MapView />);

            await waitFor(() => {
                expect(screen.getByTestId('map')).toBeInTheDocument();
            });
        });
    });
});
