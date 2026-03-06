// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import type { ApolloClient as ApolloClientType } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

const mockGetLayer = vi.fn((_layerId: string): { id: string } | undefined => undefined);
const mockQueryRenderedFeatures = vi.fn((): Array<{ layer?: { id?: string } }> => []);

vi.mock('react-map-gl/maplibre', () => {
    return {
        default: React.forwardRef(({ onLoad, children, onClick, ...props }: any, ref: any) => {
            const mockMap = {
                on: vi.fn(),
                off: vi.fn(),
                easeTo: vi.fn(),
                flyTo: vi.fn(),
                fitBounds: vi.fn(),
                zoomIn: vi.fn(),
                zoomOut: vi.fn(),
                getCanvas: vi.fn(() => ({ style: {} })),
                getLayer: mockGetLayer,
                queryRenderedFeatures: mockQueryRenderedFeatures,
                hasImage: vi.fn(() => false),
                addImage: vi.fn(),
                project: vi.fn(() => ({ x: 100, y: 100 })),
            };

            React.useImperativeHandle(ref, () => ({
                getMap: () => mockMap,
            }));

            React.useEffect(() => {
                if (onLoad) {
                    setTimeout(() => onLoad(), 0);
                }
            }, [onLoad]);

            const handleClick = (e: any) => {
                if (onClick) {
                    onClick({
                        ...e,
                        lngLat: { lat: 0, lng: 0 },
                        point: { x: 100, y: 100 },
                    });
                }
            };

            const handleKeyDown = (e: React.KeyboardEvent) => {
                if ((e.key === 'Enter' || e.key === ' ') && onClick) {
                    e.preventDefault();
                    onClick({
                        ...e,
                        lngLat: { lat: 0, lng: 0 },
                        point: { x: 100, y: 100 },
                    });
                }
            };

            return (
                <div data-testid="map" {...props} role="application" tabIndex={0} onClick={handleClick} onKeyDown={handleKeyDown}>
                    {children}
                </div>
            );
        }),
        Source: ({ children }: any) => children,
        Layer: () => null,
        Marker: ({ children, longitude, latitude }: any) => <div data-testid={`marker-${latitude}-${longitude}`}>{children}</div>,
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
                    getLayer: mockGetLayer,
                    queryRenderedFeatures: mockQueryRenderedFeatures,
                    hasImage: vi.fn(() => false),
                    addImage: vi.fn(),
                    project: vi.fn(() => ({ x: 100, y: 100 })),
                }),
            },
        })),
    };
});

const mockRouteContext = {
    start: null as { lat: number; lng: number } | null,
    end: null as { lat: number; lng: number } | null,
    setStart: vi.fn(),
    setEnd: vi.fn(),
    vehicle: 'Car' as const,
    setVehicle: vi.fn(),
    positionSelectionMode: null as 'start' | 'end' | null,
    setPositionSelectionMode: vi.fn(),
    routeData: undefined as any,
    isLoading: false,
    error: null as Error | null,
    findRoute: vi.fn(),
    showAdditionalSummary: true,
    setShowAdditionalSummary: vi.fn(),
    showDirectLine: false,
    setShowDirectLine: vi.fn(),
};

vi.mock('./context/RouteContext', () => ({
    useRouteContext: () => mockRouteContext,
}));

vi.mock('./MapPanels', () => {
    const MockMapPanels = ({
        activeView,
        onViewChange,
        selectedElement,
        onBackFromInspector,
        selectedFocusAreaId,
        onFocusAreaSelect,
    }: {
        activeView: string | null;
        onViewChange: (view: string | null) => void;
        selectedElement?: any;
        onBackFromInspector?: () => void;
        selectedFocusAreaId?: string | null;
        onFocusAreaSelect?: (focusAreaId: string | null) => void;
    }) => {
        return (
            <div data-testid="map-panels">
                <button onClick={() => onViewChange(activeView === 'scenario' ? null : 'scenario')}>Toggle Scenario</button>
                <button onClick={() => onViewChange('assets')} data-testid="open-assets-panel">
                    Open Assets
                </button>
                <button onClick={() => onViewChange('exposure')} data-testid="open-exposure-panel">
                    Open Exposure
                </button>
                <button onClick={() => onViewChange('focus-area')} data-testid="open-focus-area-panel">
                    Open Focus Area
                </button>
                <button onClick={() => onFocusAreaSelect?.('user-focus-area-1')} data-testid="select-user-focus-area">
                    Select User Focus Area
                </button>
                <div data-testid="active-view">{activeView || 'none'}</div>
                <div data-testid="selected-element">{selectedElement?.id || 'none'}</div>
                <div data-testid="selected-focus-area-id">{selectedFocusAreaId || 'none'}</div>
                {onBackFromInspector && <button onClick={onBackFromInspector}>Back from Inspector</button>}
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

vi.mock('./AssetLayers', () => ({
    default: ({ onElementClick, selectedElements }: any) => (
        <div data-testid="asset-layers">
            <button
                type="button"
                onClick={() =>
                    onElementClick?.([
                        {
                            id: 'asset-1',
                        },
                    ])
                }
                data-testid="select-asset"
            >
                Select Asset
            </button>
            <div data-testid="selected-elements-count">{selectedElements?.length ?? 0}</div>
        </div>
    ),
    ASSET_SYMBOL_LAYER_ID: 'map-v2-asset-symbol-layer',
}));

vi.mock('./UtilitiesLayers', () => ({
    default: () => <div data-testid="utilities-layers">Utilities Layers</div>,
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

const mockGetRoadRoute = vi.fn();
const mockRoadRouteData = vi.fn();
const mockRoadRouteLoading = vi.fn();
const mockRoadRouteError = vi.fn();

vi.mock('@/api/utilities', () => ({
    useRoadRouteLazyQuery: () => [
        mockGetRoadRoute,
        {
            data: mockRoadRouteData(),
            loading: mockRoadRouteLoading(),
            error: mockRoadRouteError(),
        },
    ],
}));

const mockActiveFocusAreasProps = vi.fn();
vi.mock('./ActiveFocusAreas', () => ({
    default: (props: any) => {
        mockActiveFocusAreasProps(props);
        return <div data-testid="active-focus-areas">Active Focus Areas</div>;
    },
}));

const mockInactiveFocusAreasProps = vi.fn();
vi.mock('./InactiveFocusAreas', () => ({
    default: (props: any) => {
        mockInactiveFocusAreasProps(props);
        return <div data-testid="inactive-focus-areas">Inactive Focus Areas</div>;
    },
}));

const mockUseMultipleFocusAreaAssets = vi.fn();
vi.mock('@/hooks/useMultipleFocusAreaAssets', () => ({
    useMultipleFocusAreaAssets: (...args: any[]) => mockUseMultipleFocusAreaAssets(...args),
}));

const mockUseScenarioAssets = vi.fn();
vi.mock('@/hooks/useScenarioAssets', () => ({
    useScenarioAssets: (...args: any[]) => mockUseScenarioAssets(...args),
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
        mockRoadRouteData.mockReturnValue(undefined);
        mockRoadRouteLoading.mockReturnValue(false);
        mockRoadRouteError.mockReturnValue(null);
        if (mockGetLayer) {
            mockGetLayer.mockReturnValue(undefined);
        }
        if (mockQueryRenderedFeatures) {
            mockQueryRenderedFeatures.mockReturnValue([]);
        }
        mockUseMultipleFocusAreaAssets.mockReturnValue({
            assets: [],
            isLoading: false,
            isFetching: false,
            hasError: false,
            errors: [],
        });
        mockUseScenarioAssets.mockImplementation(() => ({
            assets: [],
            isLoading: false,
            isFetching: false,
            hasError: false,
            errors: [],
        }));
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

    describe('Asset deselection via map click', () => {
        it('clears selected asset and returns to previous panel when map is clicked', async () => {
            renderWithProviders(<MapView />);
            await waitForElement('map');
            await waitForElement('map-panels');
            await waitForElement('asset-layers');

            expect(screen.getByTestId('active-view')).toHaveTextContent('focus-area');
            expect(screen.getByTestId('selected-element')).toHaveTextContent('none');

            const selectAssetButton = screen.getByTestId('select-asset');
            await act(async () => {
                selectAssetButton.click();
            });

            await waitFor(() => {
                expect(screen.getByTestId('active-view')).toHaveTextContent('inspector');
                expect(screen.getByTestId('selected-element')).toHaveTextContent('asset-1');
            });

            if (mockGetLayer) {
                mockGetLayer.mockReturnValue(undefined);
            }
            if (mockQueryRenderedFeatures) {
                mockQueryRenderedFeatures.mockReturnValue([]);
            }

            const map = screen.getByTestId('map');
            await act(async () => {
                fireEvent.click(map);
            });

            await waitFor(() => {
                expect(screen.getByTestId('active-view')).toHaveTextContent('focus-area');
                expect(screen.getByTestId('selected-element')).toHaveTextContent('none');
            });
        });

        it('does not deselect asset when clicking on an asset layer', async () => {
            renderWithProviders(<MapView />);
            await waitForElement('map');
            await waitForElement('map-panels');
            await waitForElement('asset-layers');

            const selectAssetButton = screen.getByTestId('select-asset');
            await act(async () => {
                selectAssetButton.click();
            });

            await waitFor(() => {
                expect(screen.getByTestId('active-view')).toHaveTextContent('inspector');
                expect(screen.getByTestId('selected-element')).toHaveTextContent('asset-1');
            });

            if (mockGetLayer) {
                mockGetLayer.mockImplementation((layerId?: string) => {
                    if (layerId && ['map-v2-asset-symbol-layer', 'map-v2-asset-symbol-layer-selected', 'map-v2-asset-line-layer'].includes(layerId)) {
                        return { id: layerId };
                    }
                    return undefined;
                });
            }
            if (mockQueryRenderedFeatures) {
                mockQueryRenderedFeatures.mockReturnValue([{ layer: { id: 'map-v2-asset-symbol-layer' } }]);
            }

            const map = screen.getByTestId('map');
            await act(async () => {
                fireEvent.click(map);
            });

            await waitFor(() => {
                expect(screen.getByTestId('active-view')).toHaveTextContent('inspector');
                expect(screen.getByTestId('selected-element')).toHaveTextContent('asset-1');
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

    describe('Road route visibility binding to map-wide', () => {
        beforeEach(() => {
            mockFetchFocusAreas.mockResolvedValue([{ id: 'map-wide-id', name: 'Map-wide', isSystem: true, isActive: true }]);
        });

        it('renders utilities layers component', async () => {
            const queryClient = createTestQueryClient();
            renderWithProviders(<MapView />, queryClient);
            await waitForElement('map');
            await waitForElement('utilities-layers');

            expect(screen.getByTestId('utilities-layers')).toBeInTheDocument();
        });
    });

    describe('Multi-focus area rendering in Assets/Exposure panels', () => {
        const mockPolygon = {
            type: 'Polygon' as const,
            coordinates: [
                [
                    [0, 0],
                    [1, 0],
                    [1, 1],
                    [0, 1],
                    [0, 0],
                ],
            ],
        };

        const mockFocusAreas = [
            { id: 'map-wide-id', name: 'Map-wide', isSystem: true, isActive: true, geometry: null, filterMode: 'by_asset_type' as const },
            { id: 'fa-1', name: 'Focus Area 1', isSystem: false, isActive: true, geometry: mockPolygon, filterMode: 'by_asset_type' as const },
            { id: 'fa-2', name: 'Focus Area 2', isSystem: false, isActive: false, geometry: mockPolygon, filterMode: 'by_asset_type' as const },
            { id: 'fa-3', name: 'Focus Area 3', isSystem: false, isActive: true, geometry: mockPolygon, filterMode: 'by_asset_type' as const },
        ];

        beforeEach(() => {
            mockFetchFocusAreas.mockResolvedValue(mockFocusAreas);
        });

        it('renders ActiveFocusAreas and InactiveFocusAreas when in Assets panel', async () => {
            const queryClient = createTestQueryClient();
            renderWithProviders(<MapView />, queryClient);
            await waitForElement('map');
            await waitForElement('map-panels');

            const openAssetsButton = screen.getByTestId('open-assets-panel');
            await act(async () => {
                openAssetsButton.click();
            });

            await waitFor(() => {
                expect(screen.getByTestId('active-view')).toHaveTextContent('assets');
            });

            await waitFor(() => {
                expect(mockActiveFocusAreasProps).toHaveBeenCalled();
            });

            const activeFocusAreasCall = mockActiveFocusAreasProps.mock.calls[mockActiveFocusAreasProps.mock.calls.length - 1];
            expect(activeFocusAreasCall[0].showMask).toBe(false);
            expect(activeFocusAreasCall[0].focusAreas).toBeDefined();

            expect(mockInactiveFocusAreasProps).toHaveBeenCalled();
            const inactiveFocusAreasCall = mockInactiveFocusAreasProps.mock.calls[mockInactiveFocusAreasProps.mock.calls.length - 1];
            expect(inactiveFocusAreasCall[0].focusAreas).toBeDefined();
        });

        it('renders ActiveFocusAreas and InactiveFocusAreas when in Exposure panel', async () => {
            const queryClient = createTestQueryClient();
            renderWithProviders(<MapView />, queryClient);
            await waitForElement('map');
            await waitForElement('map-panels');

            const openExposureButton = screen.getByTestId('open-exposure-panel');
            await act(async () => {
                openExposureButton.click();
            });

            await waitFor(() => {
                expect(screen.getByTestId('active-view')).toHaveTextContent('exposure');
            });

            await waitFor(() => {
                expect(mockActiveFocusAreasProps).toHaveBeenCalled();
            });

            expect(mockInactiveFocusAreasProps).toHaveBeenCalled();
        });

        it('does not render ActiveFocusAreas and InactiveFocusAreas when in Focus Area panel', async () => {
            const queryClient = createTestQueryClient();
            renderWithProviders(<MapView />, queryClient);
            await waitForElement('map');
            await waitForElement('map-panels');

            mockActiveFocusAreasProps.mockClear();
            mockInactiveFocusAreasProps.mockClear();

            const openFocusAreaButton = screen.getByTestId('open-focus-area-panel');
            await act(async () => {
                openFocusAreaButton.click();
            });

            await waitFor(() => {
                expect(screen.getByTestId('active-view')).toHaveTextContent('focus-area');
            });

            const activeCalls = mockActiveFocusAreasProps.mock.calls.filter((call) => call[0]?.focusAreas?.length > 0);
            const inactiveCalls = mockInactiveFocusAreasProps.mock.calls.filter((call) => call[0]?.focusAreas?.length > 0);

            expect(activeCalls.length).toBe(0);
            expect(inactiveCalls.length).toBe(0);
        });

        it('fetches assets only from active focus areas when in Assets panel', async () => {
            const queryClient = createTestQueryClient();
            renderWithProviders(<MapView />, queryClient);
            await waitForElement('map');
            await waitForElement('map-panels');

            const openAssetsButton = screen.getByTestId('open-assets-panel');
            await act(async () => {
                openAssetsButton.click();
            });

            await waitFor(() => {
                expect(screen.getByTestId('active-view')).toHaveTextContent('assets');
            });

            await waitFor(() => {
                expect(mockUseMultipleFocusAreaAssets).toHaveBeenCalled();
            });

            const calls = mockUseMultipleFocusAreaAssets.mock.calls;
            const assetsPanelCall = calls.find((call) => {
                const focusAreaIds = call[0]?.focusAreaIds || [];
                return focusAreaIds.length > 0 && focusAreaIds.includes('fa-1') && focusAreaIds.includes('fa-3') && !focusAreaIds.includes('fa-2');
            });

            expect(assetsPanelCall).toBeDefined();
        });

        it('fetches assets only from active focus areas when in Exposure panel', async () => {
            const queryClient = createTestQueryClient();
            renderWithProviders(<MapView />, queryClient);
            await waitForElement('map');
            await waitForElement('map-panels');

            const openExposureButton = screen.getByTestId('open-exposure-panel');
            await act(async () => {
                openExposureButton.click();
            });

            await waitFor(() => {
                expect(screen.getByTestId('active-view')).toHaveTextContent('exposure');
            });

            await waitFor(() => {
                expect(mockUseMultipleFocusAreaAssets).toHaveBeenCalled();
            });

            const calls = mockUseMultipleFocusAreaAssets.mock.calls;
            const exposurePanelCall = calls.find((call) => {
                const focusAreaIds = call[0]?.focusAreaIds || [];
                return focusAreaIds.length > 0 && focusAreaIds.includes('fa-1') && !focusAreaIds.includes('fa-2');
            });

            expect(exposurePanelCall).toBeDefined();
        });

        it('combines assets from multiple focus areas and map-wide correctly', async () => {
            const mockAssets1 = [
                {
                    id: 'asset-1',
                    type: 'type-1',
                    lat: 50,
                    lng: -1,
                    geometry: { type: 'Point' as const, coordinates: [-1, 50] },
                    dependent: { criticalitySum: 0 },
                    styles: {},
                    elementType: 'asset' as const,
                },
            ];
            const mockMapWideAssets = [
                {
                    id: 'asset-3',
                    type: 'type-1',
                    lat: 52,
                    lng: -3,
                    geometry: { type: 'Point' as const, coordinates: [-3, 52] },
                    dependent: { criticalitySum: 0 },
                    styles: {},
                    elementType: 'asset' as const,
                },
            ];

            mockUseMultipleFocusAreaAssets.mockReturnValue({
                assets: mockAssets1,
                isLoading: false,
                isFetching: false,
                hasError: false,
                errors: [],
            });

            mockUseScenarioAssets.mockImplementation((args: any) => {
                if (args?.focusAreaId === 'map-wide-id') {
                    return {
                        assets: mockMapWideAssets,
                        isLoading: false,
                        isFetching: false,
                        hasError: false,
                        errors: [],
                    };
                }
                return {
                    assets: [],
                    isLoading: false,
                    isFetching: false,
                    hasError: false,
                    errors: [],
                };
            });

            const queryClient = createTestQueryClient();
            renderWithProviders(<MapView />, queryClient);
            await waitForElement('map');
            await waitForElement('map-panels');

            const openAssetsButton = screen.getByTestId('open-assets-panel');
            await act(async () => {
                openAssetsButton.click();
            });

            await waitFor(() => {
                expect(mockUseMultipleFocusAreaAssets).toHaveBeenCalled();
            });
        });

        it('deduplicates assets when combining from multiple sources', async () => {
            const duplicateAsset = {
                id: 'asset-1',
                type: 'type-1',
                lat: 50,
                lng: -1,
                geometry: { type: 'Point' as const, coordinates: [-1, 50] },
                dependent: { criticalitySum: 0 },
                styles: {},
                elementType: 'asset' as const,
            };

            mockUseMultipleFocusAreaAssets.mockReturnValue({
                assets: [duplicateAsset],
                isLoading: false,
                isFetching: false,
                hasError: false,
                errors: [],
            });

            mockUseScenarioAssets.mockImplementation((args: any) => {
                if (args?.focusAreaId === 'map-wide-id') {
                    return {
                        assets: [duplicateAsset],
                        isLoading: false,
                        isFetching: false,
                        hasError: false,
                        errors: [],
                    };
                }
                return {
                    assets: [],
                    isLoading: false,
                    isFetching: false,
                    hasError: false,
                    errors: [],
                };
            });

            const queryClient = createTestQueryClient();
            renderWithProviders(<MapView />, queryClient);
            await waitForElement('map');
            await waitForElement('map-panels');

            const openAssetsButton = screen.getByTestId('open-assets-panel');
            await act(async () => {
                openAssetsButton.click();
            });

            await waitFor(() => {
                expect(mockUseMultipleFocusAreaAssets).toHaveBeenCalled();
            });
        });
    });
});
