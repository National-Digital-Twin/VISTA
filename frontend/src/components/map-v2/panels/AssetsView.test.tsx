import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import AssetsView from './AssetsView';
import theme from '@/theme';
import { fetchScenarioAssetTypes, toggleAssetTypeVisibility, clearAllAssetTypeVisibility } from '@/api/scenario-asset-types';
import { fetchFocusAreas } from '@/api/focus-areas';
import { fetchDataSources } from '@/api/datasources';

vi.mock('@/api/scenario-asset-types', () => ({
    fetchScenarioAssetTypes: vi.fn(),
    toggleAssetTypeVisibility: vi.fn(),
    clearAllAssetTypeVisibility: vi.fn(),
}));

vi.mock('@/api/focus-areas', () => ({
    fetchFocusAreas: vi.fn(),
}));

vi.mock('@/api/datasources', () => ({
    fetchDataSources: vi.fn(),
}));

const mockedFetchScenarioAssetTypes = vi.mocked(fetchScenarioAssetTypes);
const mockedToggleAssetTypeVisibility = vi.mocked(toggleAssetTypeVisibility);
const mockedClearAllAssetTypeVisibility = vi.mocked(clearAllAssetTypeVisibility);
const mockedFetchFocusAreas = vi.mocked(fetchFocusAreas);
const mockedFetchDataSources = vi.mocked(fetchDataSources);

describe('AssetsView', () => {
    const defaultProps = {
        onClose: vi.fn(),
        scenarioId: 'test-scenario-id',
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
                    assetCount: number;
                    isActive: boolean;
                    datasourceId: string | null;
                }>;
            }>;
        }>;
        focusAreas?: Array<{
            id: string;
            name: string;
            isActive: boolean;
            geometry: object;
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
                                    assetCount: 42,
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
                    id: 'focus-area-1',
                    name: 'Area 1',
                    isActive: true,
                    geometry: { type: 'Point', coordinates: [0, 0] },
                },
            ],
        } = options || {};

        mockedFetchScenarioAssetTypes.mockResolvedValue(assetCategories as any);
        mockedFetchFocusAreas.mockResolvedValue(focusAreas as any);
        mockedFetchDataSources.mockResolvedValue([
            {
                id: 'ds-1',
                name: 'OS Names',
                assetCount: 100,
                lastUpdated: '2025-07-22T11:54:00Z',
                owner: 'test-owner',
            },
        ]);
        mockedToggleAssetTypeVisibility.mockResolvedValue({
            assetTypeId: '35a910f3-f611-4096-ac0b-0928c5612e32',
            focusAreaId: null,
            isActive: true,
        });
        mockedClearAllAssetTypeVisibility.mockResolvedValue(undefined);
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
                expect(screen.getByLabelText('Select visible focus area')).toBeInTheDocument();
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
            mockedFetchFocusAreas.mockResolvedValue([]);
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
            renderWithProviders(<AssetsView {...defaultProps} />);
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
                expect(screen.getByLabelText('Select visible focus area')).toBeInTheDocument();
            });

            const selectElement = screen.getByLabelText('Select visible focus area');
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
                expect(screen.getByLabelText('Select visible focus area')).toBeInTheDocument();
            });

            const selectElement = screen.getByLabelText('Select visible focus area');
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
                                    { id: 'asset-1', name: 'Hospital', assetCount: 25, isActive: true, datasourceId: 'ds-1' },
                                    { id: 'asset-2', name: 'School', assetCount: 10, isActive: false, datasourceId: 'ds-1' },
                                ],
                            },
                        ],
                    },
                ],
            });
            renderWithProviders(<AssetsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Utility infrastructure \(1\)/)).toBeInTheDocument();
            });
        });

        it('displays subcategories without count when no assets are visible', async () => {
            setupMocks();
            renderWithProviders(<AssetsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Utility infrastructure')).toBeInTheDocument();
            });
            expect(screen.queryByText(/Utility infrastructure \(\d+\)/)).not.toBeInTheDocument();
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
                                        assetCount: 25,
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
                                        assetCount: 15,
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

            // Subcategory with visible asset should be expanded (not in collapsed state)
            await waitFor(() => {
                const hospitalElement = screen.getByText(/Hospital \(25\)/);
                expect(hospitalElement.closest('.MuiCollapse-hidden')).toBeNull();
            });

            // Subcategory without visible assets should be collapsed
            const railwayElement = screen.getByText(/Railway Station \(15\)/);
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
                                        assetCount: 30,
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

            // Subcategory should be collapsed since no assets are visible
            const hospitalElement = screen.getByText(/Hospital \(30\)/);
            expect(hospitalElement.closest('.MuiCollapse-hidden')).not.toBeNull();
        });

        it('expands subcategory when clicked', async () => {
            setupMocks();
            renderWithProviders(<AssetsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Utility infrastructure')).toBeInTheDocument();
            });

            const subCategoryHeader = screen.getByText('Utility infrastructure');
            fireEvent.click(subCategoryHeader);

            await waitFor(() => {
                expect(screen.getByText(/Hospital \(42\)/)).toBeInTheDocument();
            });
        });

        it('collapses subcategory when clicked again', async () => {
            setupMocks();
            renderWithProviders(<AssetsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Utility infrastructure')).toBeInTheDocument();
            });

            const subCategoryHeader = screen.getByText('Utility infrastructure');
            fireEvent.click(subCategoryHeader);

            await waitFor(() => {
                expect(screen.getByText(/Hospital \(42\)/)).toBeInTheDocument();
            });

            fireEvent.click(subCategoryHeader);

            await waitFor(() => {
                const hospitalElement = screen.queryByText(/Hospital \(42\)/);
                const isHidden = !hospitalElement || hospitalElement.closest('.MuiCollapse-hidden') !== null;
                expect(isHidden).toBe(true);
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
                expect(screen.getByText(/Hospital \(42\)/)).toBeInTheDocument();
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
            renderWithProviders(<AssetsView {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByLabelText('Clear all visible assets')).toBeInTheDocument();
            });

            const clearButton = screen.getByLabelText('Clear all visible assets');
            fireEvent.click(clearButton);

            await waitFor(() => {
                expect(mockedClearAllAssetTypeVisibility).toHaveBeenCalledWith('test-scenario-id', null);
            });
        });
    });

    describe('Visibility Toggle', () => {
        beforeEach(() => {
            setupMocks();
        });

        it('calls toggleAssetTypeVisibility when eye icon is clicked', async () => {
            renderWithProviders(<AssetsView {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByText('Utility infrastructure')).toBeInTheDocument();
            });

            const subCategoryHeader = screen.getByText('Utility infrastructure');
            fireEvent.click(subCategoryHeader);

            await waitFor(() => {
                expect(screen.getByText(/Hospital \(42\)/)).toBeInTheDocument();
            });

            const visibilityButton = screen.getByLabelText('Show Hospital');
            fireEvent.click(visibilityButton);

            await waitFor(() => {
                expect(mockedToggleAssetTypeVisibility).toHaveBeenCalledWith('test-scenario-id', {
                    assetTypeId: '35a910f3-f611-4096-ac0b-0928c5612e32',
                    focusAreaId: null,
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
                                        assetCount: 50,
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

            await waitFor(() => {
                expect(screen.getByText(/Utility infrastructure \(1\)/)).toBeInTheDocument();
            });

            const subCategoryHeader = screen.getByText(/Utility infrastructure \(1\)/);
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
});
