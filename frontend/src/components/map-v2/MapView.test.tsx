import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApolloProvider } from '@apollo/client/react';
import { ThemeProvider } from '@mui/material/styles';
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import type { ApolloClient as ApolloClientType } from '@apollo/client';
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

const createTestApolloClient = () => {
    return new ApolloClient({
        link: new HttpLink({
            uri: '/test-graphql',
            fetch: vi.fn(),
        }),
        cache: new InMemoryCache(),
    });
};

const renderWithProviders = (component: React.ReactElement, queryClient?: QueryClient, apolloClient?: ApolloClientType) => {
    const qClient = queryClient || createTestQueryClient();
    const aClient = apolloClient || createTestApolloClient();
    return render(
        <ApolloProvider client={aClient}>
            <QueryClientProvider client={qClient}>
                <ThemeProvider theme={theme}>{component}</ThemeProvider>
            </QueryClientProvider>
        </ApolloProvider>,
    );
};

vi.mock('react-map-gl/maplibre', () => ({
    default: React.forwardRef(({ onLoad, children, ...props }: any, ref: any) => {
        React.useImperativeHandle(ref, () => ({
            getMap: () => ({
                on: vi.fn(),
                off: vi.fn(),
                easeTo: vi.fn(),
                flyTo: vi.fn(),
                fitBounds: vi.fn(),
                zoomIn: vi.fn(),
                zoomOut: vi.fn(),
                getCanvas: vi.fn(() => ({ style: {} })),
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
                flyTo: vi.fn(),
                fitBounds: vi.fn(),
                zoomIn: vi.fn(),
                zoomOut: vi.fn(),
                getCanvas: vi.fn(() => ({ style: {} })),
            }),
        },
    })),
}));

vi.mock('./MapPanels', () => {
    const MockMapPanels = ({
        activeView,
        onViewChange,
        selectedElement,
        onBackFromAssetDetails,
        onUtilityToggle,
        onRoadRouteVehicleChange,
        roadRouteVehicle,
        selectedFocusAreaId,
        onFocusAreaSelect,
    }: {
        activeView: string | null;
        onViewChange: (view: string | null) => void;
        selectedElement?: any;
        onBackFromAssetDetails?: () => void;
        onUtilityToggle?: (utilityId: string, enabled: boolean) => void;
        onRoadRouteVehicleChange?: (vehicle: any) => void;
        roadRouteVehicle?: string;
        selectedFocusAreaId?: string | null;
        onFocusAreaSelect?: (focusAreaId: string | null) => void;
    }) => {
        const [roadRouteEnabled, setRoadRouteEnabled] = React.useState(false);

        const handleToggleRoadRoute = () => {
            const next = !roadRouteEnabled;
            setRoadRouteEnabled(next);
            onUtilityToggle?.('road-route', next);
        };

        return (
            <div data-testid="map-panels">
                <button onClick={() => onViewChange(activeView === 'scenario' ? null : 'scenario')}>Toggle Scenario</button>
                <button onClick={handleToggleRoadRoute} data-testid="toggle-road-route">
                    Road Route {roadRouteEnabled ? 'On' : 'Off'}
                </button>
                <button onClick={() => onRoadRouteVehicleChange?.('HGV')} data-testid="set-vehicle-hgv">
                    Set Vehicle HGV
                </button>
                <button onClick={() => onFocusAreaSelect?.('user-focus-area-1')} data-testid="select-user-focus-area">
                    Select User Focus Area
                </button>
                <div data-testid="vehicle-value">{roadRouteVehicle || 'Car'}</div>
                <div data-testid="active-view">{activeView || 'none'}</div>
                <div data-testid="selected-element">{selectedElement?.id || 'none'}</div>
                <div data-testid="selected-focus-area-id">{selectedFocusAreaId || 'none'}</div>
                {onBackFromAssetDetails && <button onClick={onBackFromAssetDetails}>Back from Asset Details</button>}
            </div>
        );
    };

    return { default: MockMapPanels };
});

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

const mockFetchFocusAreas = vi.fn();
vi.mock('@/api/focus-areas', () => ({
    fetchFocusAreas: (...args: any[]) => mockFetchFocusAreas(...args),
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
        mockFetchFocusAreas.mockResolvedValue([]);
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

    describe('Road route form reset', () => {
        it('resets vehicle to Car when road route is toggled off', async () => {
            renderWithProviders(<MapView />);
            await waitForElement('map-panels');

            await waitForElement('set-vehicle-hgv');
            const setVehicleButton = screen.getByTestId('set-vehicle-hgv');
            act(() => {
                setVehicleButton.click();
            });

            await waitFor(() => {
                expect(screen.getByTestId('vehicle-value')).toHaveTextContent('HGV');
            });

            const toggleRoadRouteButton = screen.getByTestId('toggle-road-route');

            act(() => {
                toggleRoadRouteButton.click();
            });
            act(() => {
                toggleRoadRouteButton.click();
            });

            await waitFor(() => {
                expect(screen.getByTestId('vehicle-value')).toHaveTextContent('Car');
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

    describe('Focus Area Selection', () => {
        it('auto-selects map-wide focus area on initial load', async () => {
            mockFetchFocusAreas.mockResolvedValue([
                { id: 'map-wide-id', name: 'Map-wide', isSystem: true, isActive: true },
                { id: 'user-focus-area-1', name: 'User Area 1', isSystem: false, isActive: true },
            ]);

            renderWithProviders(<MapView />);

            await waitFor(() => {
                expect(screen.getByTestId('selected-focus-area-id')).toHaveTextContent('map-wide-id');
            });
        });

        it('resets to map-wide when selected focus area is deleted', async () => {
            const queryClient = createTestQueryClient();

            mockFetchFocusAreas.mockResolvedValue([
                { id: 'map-wide-id', name: 'Map-wide', isSystem: true, isActive: true },
                { id: 'user-focus-area-1', name: 'User Area 1', isSystem: false, isActive: true },
            ]);

            renderWithProviders(<MapView />, queryClient);

            await waitFor(() => {
                expect(screen.getByTestId('selected-focus-area-id')).toHaveTextContent('map-wide-id');
            });

            const selectUserFocusAreaButton = screen.getByTestId('select-user-focus-area');
            await act(async () => {
                selectUserFocusAreaButton.click();
            });

            await waitFor(() => {
                expect(screen.getByTestId('selected-focus-area-id')).toHaveTextContent('user-focus-area-1');
            });

            mockFetchFocusAreas.mockResolvedValue([{ id: 'map-wide-id', name: 'Map-wide', isSystem: true, isActive: true }]);

            await act(async () => {
                queryClient.invalidateQueries({ queryKey: ['focusAreas'] });
            });

            await waitFor(() => {
                expect(screen.getByTestId('selected-focus-area-id')).toHaveTextContent('map-wide-id');
            });
        });
    });
});
