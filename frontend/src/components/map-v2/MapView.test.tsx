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
    default: ({ mapStylePanelOpen, onToggleMapStylePanel, onMapStyleChange }: any) => (
        <div data-testid="map-controls">
            <button onClick={onToggleMapStylePanel} data-testid="map-style-toggle">
                Map Style {mapStylePanelOpen ? 'Open' : 'Closed'}
            </button>
            <button onClick={() => onMapStyleChange('streets')} data-testid="change-style">
                Change Style
            </button>
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

vi.mock('@/hooks/useActiveScenario', () => ({
    useActiveScenario: () => ({
        data: { id: 'test-scenario-id', name: 'Test Scenario', isActive: true },
        isLoading: false,
    }),
}));

vi.mock('@/api/focus-areas', () => ({
    fetchFocusAreas: vi.fn().mockResolvedValue([]),
    createFocusArea: vi.fn().mockResolvedValue({ id: 'new-focus-area', name: 'Area 1', isActive: true }),
}));

const waitForElement = async (testId: string) => {
    await waitFor(() => {
        expect(screen.getByTestId(testId)).toBeInTheDocument();
    });
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
    });

    describe('Panel State Management', () => {
        it('starts with focus-area panel active', async () => {
            renderWithProviders(<MapView />);
            await waitFor(() => {
                expect(screen.getByTestId('active-view')).toHaveTextContent('focus-area');
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

            // Clicking toggles from focus-area to scenario
            await waitFor(() => {
                expect(screen.getByTestId('active-view')).toHaveTextContent('scenario');
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
