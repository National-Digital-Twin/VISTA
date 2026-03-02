import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AssetsView from './AssetsView';
import { fetchAssetScoreFilters, putAssetScoreFilter } from '@/api/asset-score-filters';
import { fetchDataSources } from '@/api/datasources';
import { fetchFocusAreas, updateFocusArea } from '@/api/focus-areas';
import { fetchScenarioAssetTypes, toggleAssetTypeVisibility, clearAllAssetTypeVisibility } from '@/api/scenario-asset-types';
import theme from '@/theme';

vi.mock('@/api/scenario-asset-types', () => ({
    fetchScenarioAssetTypes: vi.fn(),
    toggleAssetTypeVisibility: vi.fn(),
    clearAllAssetTypeVisibility: vi.fn(),
}));

vi.mock('@/api/focus-areas', () => ({
    fetchFocusAreas: vi.fn(),
    updateFocusArea: vi.fn(),
}));

vi.mock('@/api/datasources', () => ({
    fetchDataSources: vi.fn(),
}));

vi.mock('@/api/asset-score-filters', () => ({
    fetchAssetScoreFilters: vi.fn(),
    putAssetScoreFilter: vi.fn(),
    deleteAssetScoreFilter: vi.fn(),
}));

const mockedPutAssetScoreFilter = vi.mocked(putAssetScoreFilter);

const mockedFetchScenarioAssetTypes = vi.mocked(fetchScenarioAssetTypes);
const mockedToggleAssetTypeVisibility = vi.mocked(toggleAssetTypeVisibility);
const mockedClearAllAssetTypeVisibility = vi.mocked(clearAllAssetTypeVisibility);
const mockedFetchFocusAreas = vi.mocked(fetchFocusAreas);
const mockedUpdateFocusArea = vi.mocked(updateFocusArea);
const mockedFetchDataSources = vi.mocked(fetchDataSources);
const mockedFetchAssetScoreFilters = vi.mocked(fetchAssetScoreFilters);

describe('AssetsView', () => {
    const defaultProps = {
        onClose: vi.fn(),
        scenarioId: 'test-scenario-id',
        selectedFocusAreaId: 'map-wide-1',
    };

    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        });
        vi.clearAllMocks();
    });

    const renderWithProviders = (component: React.ReactElement) => {
        return render(
            <QueryClientProvider client={queryClient}>
                <ThemeProvider theme={theme}>{component}</ThemeProvider>
            </QueryClientProvider>,
        );
    };

    const setupMocks = (options?: {
        assetCategories?: Array<{
            id: string;
            name: string;
            subCategories: Array<{
                id: string;
                name: string;
                assetTypes: Array<{
                    id: string;
                    name: string;
                    assetCountInFocusArea: number;
                    assetCountTotal: number;
                    filteredAssetCount?: number;
                    isActive: boolean;
                    datasourceId: string | null;
                }>;
            }>;
        }>;
        focusAreas?: Array<{
            id: string;
            name: string;
            geometry: object | null;
            filterMode: string;
            isActive: boolean;
            isSystem: boolean;
        }>;
    }) => {
        const {
            assetCategories = [
                {
                    id: 'cat1',
                    name: 'Built infrastructure',
                    subCategories: [
                        {
                            id: 'subcat1',
                            name: 'Utility infrastructure',
                            assetTypes: [
                                {
                                    id: '35a910f3-f611-4096-ac0b-0928c5612e32',
                                    name: 'Hospital',
                                    assetCountInFocusArea: 42,
                                    assetCountTotal: 42,
                                    filteredAssetCount: 42,
                                    isActive: false,
                                    datasourceId: 'ds-1',
                                },
                            ],
                        },
                    ],
                },
            ],
            focusAreas = [
                {
                    id: 'map-wide-1',
                    name: 'Map-wide',
                    geometry: null,
                    filterMode: 'by_asset_type',
                    isActive: true,
                    isSystem: true,
                },
                {
                    id: 'focus-area-1',
                    name: 'Area 1',
                    geometry: { type: 'Point', coordinates: [0, 0] },
                    filterMode: 'by_asset_type',
                    isActive: true,
                    isSystem: false,
                },
            ],
        } = options || {};

        mockedFetchScenarioAssetTypes.mockResolvedValue(assetCategories as any);
        mockedFetchFocusAreas.mockResolvedValue(focusAreas as any);
        mockedFetchDataSources.mockResolvedValue([
            {
                id: 'ds-1',
                name: 'OS Names',
                description: 'ds1 description',
                assetCount: 100,
                lastUpdated: '2025-07-22T11:54:00Z',
                owner: 'test-owner',
            },
        ]);
        mockedToggleAssetTypeVisibility.mockResolvedValue({
            assetTypeId: '35a910f3-f611-4096-ac0b-0928c5612e32',
            focusAreaId: 'map-wide-1',
            isActive: true,
        });
        mockedClearAllAssetTypeVisibility.mockResolvedValue(undefined);
        mockedFetchAssetScoreFilters.mockResolvedValue([]);
        mockedUpdateFocusArea.mockResolvedValue({
            id: 'map-wide-1',
            name: 'Map-wide',
            geometry: null,
            filterMode: 'by_score_only',
            isActive: true,
            isSystem: true,
        });
    };

    const waitForComponentReady = async () => {
        await waitFor(() => {
            expect(screen.getByText('Assets')).toBeInTheDocument();
        });
    };

    describe('Rendering', () => {
        it('renders title', async () => {
            setupMocks();
            renderWithProviders(<AssetsView {...defaultProps} />);
            await waitForComponentReady();
        });

        it('renders close button', async () => {
            setupMocks();
            renderWithProviders(<AssetsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByLabelText('Close panel')).toBeInTheDocument();
            });
        });

        it('renders search input', async () => {
            setupMocks();
            renderWithProviders(<AssetsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByPlaceholderText('Search for an asset')).toBeInTheDocument();
            });
        });

        it('renders focus area dropdown', async () => {
            setupMocks();
            renderWithProviders(<AssetsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByLabelText('Select focus area')).toBeInTheDocument();
            });
        });

        it('renders filter mode dropdown as disabled', async () => {
            setupMocks();
            renderWithProviders(<AssetsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByLabelText('Select filter mode')).toBeInTheDocument();
            });
        });

        it('renders clear all button', async () => {
            setupMocks();
            renderWithProviders(<AssetsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByLabelText('Clear all visible assets')).toBeInTheDocument();
            });
        });

        it('shows no scenario selected when scenarioId is not provided', async () => {
            setupMocks();
            renderWithProviders(<AssetsView onClose={vi.fn()} />);
            await waitFor(() => {
                expect(screen.getByText('No scenario selected')).toBeInTheDocument();
            });
        });
    });

    describe('Loading State', () => {
        it('shows loading state when categories are loading', async () => {
            const neverResolvingPromise = new Promise<never>(() => {});
            mockedFetchScenarioAssetTypes.mockImplementation(() => neverResolvingPromise as Promise<any>);
            mockedFetchFocusAreas.mockResolvedValue([
                {
                    id: 'map-wide-1',
                    name: 'Map-wide',
                    geometry: null,
                    filterMode: 'by_asset_type',
                    isActive: true,
                    isSystem: true,
                },
            ] as any);
            mockedFetchDataSources.mockResolvedValue([]);
            renderWithProviders(<AssetsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Loading asset categories...')).toBeInTheDocument();
            });
        });

        it('hides loading state when categories are loaded', async () => {
            setupMocks();
            renderWithProviders(<AssetsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.queryByText('Loading asset categories...')).not.toBeInTheDocument();
            });
        });
    });

    describe('Focus Area Selection', () => {
        it('shows Map-wide as default selection', async () => {
            setupMocks();
            renderWithProviders(<AssetsView {...defaultProps} selectedFocusAreaId="map-wide-1" />);
            await waitFor(() => {
                expect(screen.getByText('Map-wide')).toBeInTheDocument();
            });
        });

        it('shows focus areas in dropdown', async () => {
            setupMocks();
            renderWithProviders(<AssetsView {...defaultProps} />);

            await waitFor(() => {
                expect(mockedFetchFocusAreas).toHaveBeenCalled();
            });

            await waitFor(() => {
                expect(screen.getByLabelText('Select focus area')).toBeInTheDocument();
            });

            const selectElement = screen.getByLabelText('Select focus area');
            fireEvent.mouseDown(selectElement);

            await waitFor(
                () => {
                    expect(screen.getByRole('listbox')).toBeInTheDocument();
                },
                { timeout: 3000 },
            );

            expect(screen.getByRole('option', { name: 'Map-wide' })).toBeInTheDocument();
            expect(screen.getByRole('option', { name: 'Area 1' })).toBeInTheDocument();
        });

        it('calls onFocusAreaSelect when focus area changes', async () => {
            const onFocusAreaSelect = vi.fn();
            setupMocks();
            renderWithProviders(<AssetsView {...defaultProps} onFocusAreaSelect={onFocusAreaSelect} />);

            await waitFor(() => {
                expect(mockedFetchFocusAreas).toHaveBeenCalled();
            });

            await waitFor(() => {
                expect(screen.getByLabelText('Select focus area')).toBeInTheDocument();
            });

            const selectElement = screen.getByLabelText('Select focus area');
            fireEvent.mouseDown(selectElement);

            await waitFor(
                () => {
                    expect(screen.getByRole('listbox')).toBeInTheDocument();
                },
                { timeout: 3000 },
            );

            const area1Option = screen.getByRole('option', { name: 'Area 1' });
            fireEvent.click(area1Option);

            await waitFor(() => {
                expect(onFocusAreaSelect).toHaveBeenCalledWith('focus-area-1');
            });
        });

        it('fetches asset types for the selected focus area', async () => {
            setupMocks();
            renderWithProviders(<AssetsView {...defaultProps} selectedFocusAreaId="focus-area-1" />);

            await waitFor(() => {
                expect(mockedFetchScenarioAssetTypes).toHaveBeenCalledWith('test-scenario-id', 'focus-area-1');
            });
        });
    });

    describe('Asset Categories', () => {
        it('displays category as static label (non-collapsible)', async () => {
            setupMocks();
            renderWithProviders(<AssetsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Built infrastructure')).toBeInTheDocument();
            });
        });

        it('displays subcategories as collapsible with active count when assets are visible', async () => {
            setupMocks({
                assetCategories: [
                    {
                        id: 'cat1',
                        name: 'Built infrastructure',
                        subCategories: [
                            {
                                id: 'subcat1',
                                name: 'Utility infrastructure',
                                assetTypes: [
                                    {
                                        id: 'asset-1',
                                        name: 'Hospital',
                                        assetCountInFocusArea: 25,
                                        assetCountTotal: 25,
                                        filteredAssetCount: 25,
                                        isActive: true,
                                        datasourceId: 'ds-1',
                                    },
                                    {
                                        id: 'asset-2',
                                        name: 'School',
                                        assetCountInFocusArea: 10,
                                        assetCountTotal: 10,
                                        filteredAssetCount: 10,
                                        isActive: false,
                                        datasourceId: 'ds-1',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
            renderWithProviders(<AssetsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Utility infrastructure')).toBeInTheDocument();
                expect(screen.getByText('1')).toBeInTheDocument();
            });
        });

        it('displays subcategories without count when no assets are visible', async () => {
            setupMocks();
            renderWithProviders(<AssetsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Utility infrastructure')).toBeInTheDocument();
            });
            expect(screen.queryByText(/\(0\)/)).not.toBeInTheDocument();
        });

        it('shows "No assets found" when no assets match search', async () => {
            setupMocks();
            renderWithProviders(<AssetsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByPlaceholderText('Search for an asset')).toBeInTheDocument();
            });
            const searchInput = screen.getByPlaceholderText('Search for an asset');
            fireEvent.change(searchInput, { target: { value: 'NonExistentCategoryName12345' } });
            await waitFor(() => {
                expect(screen.getByText('No assets found')).toBeInTheDocument();
            });
        });
    });

    describe('Subcategory Expansion', () => {
        it('auto-expands subcategories with visible asset types on load', async () => {
            setupMocks({
                assetCategories: [
                    {
                        id: 'cat1',
                        name: 'Built infrastructure',
                        subCategories: [
                            {
                                id: 'subcat1',
                                name: 'Utility infrastructure',
                                assetTypes: [
                                    {
                                        id: 'asset-1',
                                        name: 'Hospital',
                                        assetCountInFocusArea: 25,
                                        assetCountTotal: 25,
                                        filteredAssetCount: 25,
                                        isActive: true,
                                        datasourceId: 'ds-1',
                                    },
                                ],
                            },
                            {
                                id: 'subcat2',
                                name: 'Transport infrastructure',
                                assetTypes: [
                                    {
                                        id: 'asset-2',
                                        name: 'Railway Station',
                                        assetCountInFocusArea: 15,
                                        assetCountTotal: 15,
                                        filteredAssetCount: 15,
                                        isActive: false,
                                        datasourceId: 'ds-1',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
            renderWithProviders(<AssetsView {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByText(/Utility infrastructure/)).toBeInTheDocument();
            });

            await waitFor(() => {
                const hospitalElement = screen.getByText('Hospital');
                expect(screen.getByText('25 / 25')).toBeInTheDocument();
                expect(hospitalElement.closest('.MuiCollapse-hidden')).toBeNull();
            });

            const railwayElement = screen.getByText('Railway Station');
            expect(screen.getByText('15 / 15')).toBeInTheDocument();
            expect(railwayElement.closest('.MuiCollapse-hidden')).not.toBeNull();
        });

        it('does not auto-expand subcategories when no asset types are visible', async () => {
            setupMocks({
                assetCategories: [
                    {
                        id: 'cat1',
                        name: 'Built infrastructure',
                        subCategories: [
                            {
                                id: 'subcat1',
                                name: 'Utility infrastructure',
                                assetTypes: [
                                    {
                                        id: 'asset-1',
                                        name: 'Hospital',
                                        assetCountInFocusArea: 30,
                                        assetCountTotal: 30,
                                        filteredAssetCount: 30,
                                        isActive: false,
                                        datasourceId: 'ds-1',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
            renderWithProviders(<AssetsView {...defaultProps} selectedFocusAreaId="map-wide-1" />);

            await screen.findByText(/Utility infrastructure/);

            const hospitalElement = screen.queryByText('Hospital');
            const pillElement = screen.queryByText('30 / 30');
            expect(hospitalElement?.closest('.MuiCollapse-hidden')).not.toBeNull();
            if (pillElement) {
                expect(pillElement.closest('.MuiCollapse-hidden')).not.toBeNull();
            }
        });

        it('expands subcategory when clicked', async () => {
            setupMocks();
            renderWithProviders(<AssetsView {...defaultProps} />);

            const subCategoryHeader = await screen.findByText('Utility infrastructure');
            fireEvent.click(subCategoryHeader);

            await waitFor(() => {
                expect(screen.getByText('Hospital')).toBeInTheDocument();
                expect(screen.getByText('42 / 42')).toBeInTheDocument();
            });
        });

        it('collapses subcategory when clicked again', async () => {
            setupMocks();
            renderWithProviders(<AssetsView {...defaultProps} />);

            const subCategoryHeader = await screen.findByText('Utility infrastructure');
            fireEvent.click(subCategoryHeader);

            await waitFor(() => {
                expect(screen.getByText('Hospital')).toBeInTheDocument();
                expect(screen.getByText('42 / 42')).toBeInTheDocument();
            });

            fireEvent.click(subCategoryHeader);

            await waitFor(() => {
                const hospitalElement = screen.queryByText('Hospital');
                const pillElement = screen.queryByText('42 / 42');
                const isHidden = !hospitalElement || hospitalElement.closest('.MuiCollapse-hidden') !== null;
                expect(isHidden).toBe(true);
                if (pillElement) {
                    expect(pillElement.closest('.MuiCollapse-hidden')).not.toBeNull();
                }
            });
        });
    });

    describe('Search Functionality', () => {
        beforeEach(() => {
            setupMocks();
        });

        it('filters assets by search query', async () => {
            renderWithProviders(<AssetsView {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Search for an asset')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search for an asset');
            fireEvent.change(searchInput, { target: { value: 'Hospital' } });

            await waitFor(() => {
                expect(screen.getByText('Hospital')).toBeInTheDocument();
                expect(screen.getByText('42 / 42')).toBeInTheDocument();
            });
        });

        it('shows no results when search does not match', async () => {
            renderWithProviders(<AssetsView {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Search for an asset')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search for an asset');
            fireEvent.change(searchInput, { target: { value: 'NonExistent' } });

            await waitFor(() => {
                expect(screen.getByText('No assets found')).toBeInTheDocument();
            });
        });
    });

    describe('Clear All Functionality', () => {
        beforeEach(() => {
            setupMocks();
        });

        it('calls clearAllAssetTypeVisibility when clear all button is clicked', async () => {
            renderWithProviders(<AssetsView {...defaultProps} selectedFocusAreaId="map-wide-1" />);

            await waitFor(() => {
                expect(screen.getByLabelText('Clear all visible assets')).toBeInTheDocument();
            });

            const clearButton = screen.getByLabelText('Clear all visible assets');
            fireEvent.click(clearButton);

            await waitFor(() => {
                expect(mockedClearAllAssetTypeVisibility).toHaveBeenCalledWith('test-scenario-id', 'map-wide-1');
            });
        });
    });

    describe('Visibility Toggle', () => {
        beforeEach(() => {
            setupMocks();
        });

        it('calls toggleAssetTypeVisibility when eye icon is clicked', async () => {
            renderWithProviders(<AssetsView {...defaultProps} selectedFocusAreaId="map-wide-1" />);

            const subCategoryHeader = await screen.findByText('Utility infrastructure');
            fireEvent.click(subCategoryHeader);

            await waitFor(() => {
                expect(screen.getByText('Hospital')).toBeInTheDocument();
                expect(screen.getByText('42 / 42')).toBeInTheDocument();
            });

            const visibilityButton = screen.getByLabelText('Show Hospital');
            fireEvent.click(visibilityButton);

            await waitFor(() => {
                expect(mockedToggleAssetTypeVisibility).toHaveBeenCalledWith('test-scenario-id', {
                    assetTypeId: '35a910f3-f611-4096-ac0b-0928c5612e32',
                    focusAreaId: 'map-wide-1',
                    isActive: true,
                });
            });
        });

        it('shows visibility icon based on isActive state', async () => {
            setupMocks({
                assetCategories: [
                    {
                        id: 'cat1',
                        name: 'Built infrastructure',
                        subCategories: [
                            {
                                id: 'subcat1',
                                name: 'Utility infrastructure',
                                assetTypes: [
                                    {
                                        id: '35a910f3-f611-4096-ac0b-0928c5612e32',
                                        name: 'Hospital',
                                        assetCountInFocusArea: 50,
                                        assetCountTotal: 50,
                                        filteredAssetCount: 50,
                                        isActive: true,
                                        datasourceId: 'ds-1',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
            renderWithProviders(<AssetsView {...defaultProps} />);

            const subCategoryHeader = await screen.findByText('Utility infrastructure');
            fireEvent.click(subCategoryHeader);

            await waitFor(() => {
                expect(screen.getByLabelText('Hide Hospital')).toBeInTheDocument();
            });
        });
    });

    describe('Close Functionality', () => {
        it('calls onClose when close button is clicked', async () => {
            const onClose = vi.fn();
            setupMocks();
            renderWithProviders(<AssetsView {...defaultProps} onClose={onClose} />);

            await waitFor(() => {
                const closeButton = screen.getByLabelText('Close panel');
                expect(closeButton).toBeInTheDocument();
            });

            const closeButton = screen.getByLabelText('Close panel');
            fireEvent.click(closeButton);

            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });

    describe('Error States', () => {
        it('displays error message when asset categories fail to load', async () => {
            mockedFetchScenarioAssetTypes.mockRejectedValue(new Error('API Error'));
            mockedFetchFocusAreas.mockResolvedValue([
                {
                    id: 'map-wide-1',
                    name: 'Map-wide',
                    geometry: null,
                    filterMode: 'by_asset_type',
                    isActive: true,
                    isSystem: true,
                },
            ] as any);
            mockedFetchDataSources.mockResolvedValue([]);
            mockedFetchAssetScoreFilters.mockResolvedValue([]);

            renderWithProviders(<AssetsView {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByText('Error loading asset categories')).toBeInTheDocument();
            });
        });
    });

    describe('Filter Mode', () => {
        it('disables filter mode select when no focus area is selected', async () => {
            setupMocks();
            renderWithProviders(<AssetsView {...defaultProps} selectedFocusAreaId={null} />);

            await waitFor(() => {
                const filterModeSelect = screen.getByLabelText('Select filter mode');
                expect(filterModeSelect).toBeInTheDocument();
            });

            const filterModeSelect = screen.getByLabelText('Select filter mode');
            expect(filterModeSelect).toHaveClass('Mui-disabled');
        });

        it('shows message when no focus area is selected', async () => {
            setupMocks();
            renderWithProviders(<AssetsView {...defaultProps} selectedFocusAreaId={null} />);

            await waitFor(() => {
                expect(screen.getByText('Select a focus area to configure asset filters')).toBeInTheDocument();
            });
        });

        it('hides search when filter mode is by_score_only', async () => {
            setupMocks({
                focusAreas: [
                    {
                        id: 'map-wide-1',
                        name: 'Map-wide',
                        geometry: null,
                        filterMode: 'by_score_only',
                        isActive: true,
                        isSystem: true,
                    },
                ],
            });
            renderWithProviders(<AssetsView {...defaultProps} selectedFocusAreaId="map-wide-1" />);

            await waitFor(
                () => {
                    expect(screen.queryByPlaceholderText('Search for an asset')).not.toBeInTheDocument();
                },
                { timeout: 2000 },
            );
        });

        it('does not call updateFocusArea when filter mode dropdown changes', async () => {
            setupMocks();
            renderWithProviders(<AssetsView {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByLabelText('Select filter mode')).toBeInTheDocument();
            });

            const filterModeSelect = screen.getByLabelText('Select filter mode');
            fireEvent.mouseDown(filterModeSelect);

            await waitFor(() => {
                expect(screen.getByRole('listbox')).toBeInTheDocument();
            });

            const byScoreOption = screen.getByRole('option', { name: 'By VISTA score' });
            fireEvent.click(byScoreOption);

            await waitFor(() => {
                expect(screen.queryByPlaceholderText('Search for an asset')).not.toBeInTheDocument();
            });

            expect(mockedUpdateFocusArea).not.toHaveBeenCalled();
        });

        it('calls updateFocusArea when APPLY is clicked in GlobalScoreFilter if filter mode changed', async () => {
            mockedUpdateFocusArea.mockResolvedValue({} as any);
            mockedPutAssetScoreFilter.mockResolvedValue({} as any);
            setupMocks();
            renderWithProviders(<AssetsView {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByLabelText('Select filter mode')).toBeInTheDocument();
            });

            const filterModeSelect = screen.getByLabelText('Select filter mode');
            fireEvent.mouseDown(filterModeSelect);

            await waitFor(() => {
                expect(screen.getByRole('listbox')).toBeInTheDocument();
            });

            const byScoreOption = screen.getByRole('option', { name: 'By VISTA score' });
            fireEvent.click(byScoreOption);

            await waitFor(() => {
                expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
            });

            const applyButton = screen.getByRole('button', { name: 'Apply' });
            fireEvent.click(applyButton);

            await waitFor(
                () => {
                    expect(mockedUpdateFocusArea).toHaveBeenCalledWith(
                        'test-scenario-id',
                        'map-wide-1',
                        expect.objectContaining({
                            filterMode: 'by_score_only',
                        }),
                    );
                },
                { timeout: 3000 },
            );
        });

        it('does not call updateFocusArea when APPLY is clicked if filter mode has not changed', async () => {
            setupMocks({
                focusAreas: [
                    {
                        id: 'map-wide-1',
                        name: 'Map-wide',
                        geometry: null,
                        filterMode: 'by_score_only',
                        isActive: true,
                        isSystem: true,
                    },
                ],
            });
            renderWithProviders(<AssetsView {...defaultProps} selectedFocusAreaId="map-wide-1" />);

            await waitFor(() => {
                expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
            });

            const applyButton = screen.getByRole('button', { name: 'Apply' });
            fireEvent.click(applyButton);

            await waitFor(() => {
                expect(mockedUpdateFocusArea).not.toHaveBeenCalled();
            });
        });
    });

    describe('Score Filter Icon', () => {
        it('displays score filter icon for each asset type', async () => {
            setupMocks();
            renderWithProviders(<AssetsView {...defaultProps} />);

            const subCategoryHeader = await screen.findByText('Utility infrastructure');
            fireEvent.click(subCategoryHeader);

            await waitFor(() => {
                expect(screen.getByLabelText('Filter Hospital by score')).toBeInTheDocument();
            });
        });

        it('highlights filter icon when asset type has active filter', async () => {
            mockedFetchScenarioAssetTypes.mockResolvedValue([
                {
                    id: 'cat1',
                    name: 'Built infrastructure',
                    subCategories: [
                        {
                            id: 'subcat1',
                            name: 'Utility infrastructure',
                            assetTypes: [
                                {
                                    id: 'asset-1',
                                    name: 'Hospital',
                                    assetCountInFocusArea: 42,
                                    assetCountTotal: 42,
                                    filteredAssetCount: 20,
                                    isActive: false,
                                    datasourceId: 'ds-1',
                                },
                            ],
                        },
                    ],
                },
            ] as any);
            mockedFetchFocusAreas.mockResolvedValue([
                {
                    id: 'map-wide-1',
                    name: 'Map-wide',
                    geometry: null,
                    filterMode: 'by_asset_type',
                    isActive: true,
                    isSystem: true,
                },
            ] as any);
            mockedFetchDataSources.mockResolvedValue([]);
            mockedFetchAssetScoreFilters.mockResolvedValue([
                {
                    id: 'filter-1',
                    focusAreaId: 'map-wide-1',
                    assetTypeId: 'asset-1',
                    criticalityMin: 1,
                    criticalityMax: 5,
                    exposureMin: 1,
                    exposureMax: 5,
                    redundancyMin: 1,
                    redundancyMax: 5,
                    dependencyMin: 0,
                    dependencyMax: 100,
                },
            ] as any);

            renderWithProviders(<AssetsView {...defaultProps} selectedFocusAreaId="map-wide-1" />);

            const subCategoryHeader = await screen.findByText('Utility infrastructure');
            fireEvent.click(subCategoryHeader);

            await waitFor(() => {
                expect(screen.getByText('Hospital')).toBeInTheDocument();
                expect(screen.getByText('20 / 42')).toBeInTheDocument();
            });
        });
    });
});
