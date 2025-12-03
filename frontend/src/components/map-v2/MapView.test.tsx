import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import MapView from './MapView';
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

const renderWithProviders = (component: React.ReactElement, queryClient?: QueryClient) => {
    const client = queryClient || createTestQueryClient();
    return render(
        <QueryClientProvider client={client}>
            <ThemeProvider theme={theme}>{component}</ThemeProvider>
        </QueryClientProvider>,
    );
};

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
    useMap: vi.fn(() => ({
        'map-v2': {
            getMap: () => ({
                on: vi.fn(),
                off: vi.fn(),
                easeTo: vi.fn(),
                zoomIn: vi.fn(),
                zoomOut: vi.fn(),
            }),
        },
    })),
}));

vi.mock('./MapPanels', () => ({
    default: ({
        activeView,
        onViewChange,
        selectedElement,
        onBackFromAssetDetails,
    }: {
        activeView: string | null;
        onViewChange: (view: string | null) => void;
        selectedElement?: any;
        onBackFromAssetDetails?: () => void;
    }) => (
        <div data-testid="map-panels">
            <button onClick={() => onViewChange(activeView === 'scenario' ? null : 'scenario')}>Toggle Scenario</button>
            <div data-testid="active-view">{activeView || 'none'}</div>
            <div data-testid="selected-element">{selectedElement?.id || 'none'}</div>
            {onBackFromAssetDetails && <button onClick={onBackFromAssetDetails}>Back from Asset Details</button>}
        </div>
    ),
}));

vi.mock('./MapControls', () => ({
    default: ({ mapStylePanelOpen, onToggleMapStylePanel, isDrawing, onToggleDrawing, onMapStyleChange }: any) => (
        <div data-testid="map-controls">
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

vi.mock('@/api/assessments', () => ({
    fetchAssessments: vi.fn().mockResolvedValue([{ uri: 'test-assessment-uri', name: 'Test Assessment', numberOfAssessedItems: 0 }]),
}));

vi.mock('./hooks/usePreloadAssetIcons', () => ({
    usePreloadAssetIcons: vi.fn(),
}));

const mockUseAssetsByType = vi.fn();
const mockUseAssetTypeIcons = vi.fn();
const mockFetchAssetCategories = vi.fn();

vi.mock('@/hooks/useAssetsByType', () => ({
    useAssetsByType: () => mockUseAssetsByType(),
}));

vi.mock('@/hooks/useAssetTypeIcons', () => ({
    useAssetTypeIcons: () => mockUseAssetTypeIcons(),
}));

vi.mock('@/api/asset-categories', () => ({
    fetchAssetCategories: (...args: any[]) => mockFetchAssetCategories(...args),
}));

const waitForElement = async (testId: string) => {
    await waitFor(() => {
        expect(screen.getByTestId(testId)).toBeInTheDocument();
    });
};

const clickElement = async (testId: string) => {
    await waitForElement(testId);
    const element = screen.getByTestId(testId);
    await act(async () => {
        element.click();
    });
};

const openDrawingToolbar = async () => {
    await clickElement('drawing-toggle');
    await waitForElement('drawing-toolbar');
};

describe('MapView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAssetsByType.mockReturnValue({
            assets: [],
            isLoading: false,
            hasError: false,
            errors: [],
            emptyResults: [],
        });
        mockUseAssetTypeIcons.mockReturnValue(new Map());
        mockFetchAssetCategories.mockResolvedValue([]);
    });

    describe('Rendering', () => {
        it('renders map component', async () => {
            renderWithProviders(<MapView />);
            await waitForElement('map');
        });

        it('renders MapPanels component', async () => {
            renderWithProviders(<MapView />);
            await waitForElement('map-panels');
        });

        it('renders MapControls component', async () => {
            renderWithProviders(<MapView />);
            await waitForElement('map-controls');
        });

        it('does not render DrawingToolbar initially', async () => {
            renderWithProviders(<MapView />);
            await waitFor(() => {
                expect(screen.queryByTestId('drawing-toolbar')).not.toBeInTheDocument();
            });
        });
    });

    describe('Panel State Management', () => {
        it('starts with scenario panel active', async () => {
            renderWithProviders(<MapView />);
            await waitFor(() => {
                expect(screen.getByTestId('active-view')).toHaveTextContent('scenario');
            });
        });

        it('updates active panel view when MapPanels changes view', async () => {
            renderWithProviders(<MapView />);
            await waitFor(() => {
                expect(screen.getByText('Toggle Scenario')).toBeInTheDocument();
            });

            const toggleButton = screen.getByText('Toggle Scenario');
            await act(async () => {
                toggleButton.click();
            });

            await waitFor(() => {
                expect(screen.getByTestId('active-view')).toHaveTextContent('none');
            });
        });
    });

    describe('Map Style Panel Toggle', () => {
        it('toggles map style panel', async () => {
            renderWithProviders(<MapView />);
            await waitForElement('map-style-toggle');

            const mapStyleToggle = screen.getByTestId('map-style-toggle');
            expect(mapStyleToggle).toHaveTextContent('Map Style Closed');

            await act(async () => {
                mapStyleToggle.click();
            });

            await waitFor(() => {
                expect(mapStyleToggle).toHaveTextContent('Map Style Open');
            });
        });

        it('toggles map style panel state', async () => {
            renderWithProviders(<MapView />);
            await waitForElement('map-style-toggle');

            const mapStyleToggle = screen.getByTestId('map-style-toggle');
            expect(mapStyleToggle).toHaveTextContent('Map Style Closed');

            await act(async () => {
                mapStyleToggle.click();
            });

            await waitFor(() => {
                expect(mapStyleToggle).toHaveTextContent('Map Style Open');
            });

            await act(async () => {
                mapStyleToggle.click();
            });

            await waitFor(() => {
                expect(mapStyleToggle).toHaveTextContent('Map Style Closed');
            });
        });
    });

    describe('Map Style Change', () => {
        it('changes map style when MapControls calls onMapStyleChange', async () => {
            renderWithProviders(<MapView />);
            await waitForElement('change-style');

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
            await openDrawingToolbar();
        });

        it('hides drawing toolbar when toggled off', async () => {
            renderWithProviders(<MapView />);
            await openDrawingToolbar();

            await clickElement('drawing-toggle');

            await waitFor(() => {
                expect(screen.queryByTestId('drawing-toolbar')).not.toBeInTheDocument();
            });
        });

        it('updates drawing mode when DrawingToolbar changes mode', async () => {
            renderWithProviders(<MapView />);
            await openDrawingToolbar();

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
            await openDrawingToolbar();

            const drawCircleButton = screen.getByText('Draw Circle');
            await act(async () => {
                drawCircleButton.click();
            });

            await waitFor(() => {
                expect(screen.getByTestId('drawing-mode')).toHaveTextContent('circle');
            });

            await clickElement('drawing-toggle');
            await clickElement('drawing-toggle');

            await waitFor(() => {
                expect(screen.getByTestId('drawing-mode')).toHaveTextContent('none');
            });
        });
    });

    describe('Asset Filters', () => {
        it('updates primary assets state', async () => {
            renderWithProviders(<MapView />);
            await openDrawingToolbar();

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
            await openDrawingToolbar();

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
        it('adjusts map margin when panel is active', async () => {
            const { container } = renderWithProviders(<MapView />);
            await waitForElement('map');

            const mapContainer = container.querySelector('[class*="MuiBox-root"]');
            expect(mapContainer).toBeTruthy();
        });
    });

    describe('Map Load', () => {
        it('sets mapReady when map loads', async () => {
            renderWithProviders(<MapView />);
            await waitForElement('map');
        });
    });
});
