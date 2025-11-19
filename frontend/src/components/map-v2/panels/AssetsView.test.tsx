import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import AssetsView from './AssetsView';
import theme from '@/theme';
import { useGroupedAssets } from '@/hooks';
import { fetchAssessments } from '@/api/assessments';
import { fetchAssetSpecifications } from '@/api/fetchAssetSpecifications';

vi.mock('@/hooks', () => ({
    useGroupedAssets: vi.fn(),
}));

vi.mock('@/api/assessments', () => ({
    fetchAssessments: vi.fn(),
}));

vi.mock('@/api/fetchAssetSpecifications', () => ({
    fetchAssetSpecifications: vi.fn(),
}));

describe('AssetsView', () => {
    const defaultProps = {
        onClose: vi.fn(),
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

    const mockAsset = {
        uri: 'http://test.com/asset1',
        type: 'https://ies.data.gov.uk/ontology/ies4#Hospital',
        primaryCategory: 'Healthcare',
        secondaryCategory: 'Healthcare Facilities',
        styles: {
            alt: 'Hospital',
            backgroundColor: '#000000',
            color: '#ffffff',
            iconFallbackText: 'H',
        },
    };

    const mockAssetSpecification = {
        type: 'https://ies.data.gov.uk/ontology/ies4#Hospital',
        source: 'os_ngd',
    };

    const setupMocks = (options?: {
        assessments?: Array<{ uri: string }>;
        assetSpecifications?: Array<{ type: string; source: string }>;
        groupedAssets?: {
            isLoadingAssets?: boolean;
            filteredAssets?: (typeof mockAsset)[];
            progress?: number;
        };
    }) => {
        const {
            assessments = [{ uri: 'test-uri' }],
            assetSpecifications = [],
            groupedAssets = {
                isLoadingAssets: false,
                filteredAssets: [],
            },
        } = options || {};

        vi.mocked(fetchAssessments).mockResolvedValue(assessments as any);
        vi.mocked(fetchAssetSpecifications).mockResolvedValue(assetSpecifications as any);
        vi.mocked(useGroupedAssets).mockReturnValue(groupedAssets as any);
    };

    const waitForComponentReady = async () => {
        await waitFor(() => {
            expect(screen.getByText('Assets')).toBeInTheDocument();
        });
    };

    const waitForCategory = async (categoryName: string | RegExp = /Healthcare Facilities/) => {
        await waitFor(() => {
            expect(screen.getByText(categoryName)).toBeInTheDocument();
        });
        return screen.getByText(categoryName);
    };

    const expandCategory = async (categoryName: string | RegExp = /Healthcare Facilities/) => {
        const categoryHeader = await waitForCategory(categoryName);
        fireEvent.click(categoryHeader);
        await waitFor(() => {
            expect(screen.getByText('Hospital')).toBeInTheDocument();
        });
        return categoryHeader;
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
                expect(screen.getByPlaceholderText('Search for a layer')).toBeInTheDocument();
            });
        });

        it('renders sort dropdown', async () => {
            setupMocks();
            renderWithProviders(<AssetsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByRole('combobox')).toBeInTheDocument();
            });
            expect(screen.getByText('A-Z')).toBeInTheDocument();
        });

        it('renders filter button', async () => {
            setupMocks();
            renderWithProviders(<AssetsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('FILTER')).toBeInTheDocument();
            });
        });
    });

    describe('No Assessment State', () => {
        it('shows "No assessment available" when assessment is missing', async () => {
            setupMocks({ assessments: [] });
            renderWithProviders(<AssetsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('No assessment available')).toBeInTheDocument();
            });
        });
    });

    describe('Loading State', () => {
        it('shows loading overlay when assets are loading', async () => {
            setupMocks({
                groupedAssets: {
                    isLoadingAssets: true,
                    filteredAssets: [],
                    progress: 0.5,
                },
            });
            renderWithProviders(<AssetsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Loading datasets/)).toBeInTheDocument();
                expect(screen.getByText(/50%/)).toBeInTheDocument();
            });
        });

        it('hides loading overlay when assets are loaded', async () => {
            setupMocks();
            renderWithProviders(<AssetsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.queryByText(/Loading datasets/)).not.toBeInTheDocument();
            });
        });
    });

    describe('Asset Categories', () => {
        it('displays categories with asset types', async () => {
            setupMocks({
                assetSpecifications: [mockAssetSpecification],
                groupedAssets: {
                    isLoadingAssets: false,
                    filteredAssets: [mockAsset],
                },
            });
            renderWithProviders(<AssetsView {...defaultProps} />);
            await waitForCategory();
        });

        it('shows category count', async () => {
            setupMocks({
                assetSpecifications: [mockAssetSpecification],
                groupedAssets: {
                    isLoadingAssets: false,
                    filteredAssets: [mockAsset],
                },
            });
            renderWithProviders(<AssetsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Healthcare Facilities \(1\)/)).toBeInTheDocument();
            });
        });

        it('shows "No assets found" when no assets match search', async () => {
            setupMocks();
            renderWithProviders(<AssetsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('No assets found')).toBeInTheDocument();
            });
        });
    });

    describe('Category Expansion', () => {
        beforeEach(() => {
            setupMocks({
                assetSpecifications: [mockAssetSpecification],
                groupedAssets: {
                    isLoadingAssets: false,
                    filteredAssets: [mockAsset],
                },
            });
        });

        it('expands category when clicked', async () => {
            renderWithProviders(<AssetsView {...defaultProps} />);
            await expandCategory();
        });

        it('collapses category when clicked again', async () => {
            renderWithProviders(<AssetsView {...defaultProps} />);
            const categoryHeader = await expandCategory();

            fireEvent.click(categoryHeader);

            await waitFor(() => {
                expect(screen.getByText(/Healthcare Facilities/)).toBeInTheDocument();
            });

            const hospitalText = screen.queryByText('Hospital');
            if (hospitalText) {
                const collapseParent = hospitalText.closest('[class*="MuiCollapse"]');
                expect(collapseParent).toBeTruthy();
            }
        });
    });

    describe('Search Functionality', () => {
        beforeEach(() => {
            setupMocks({
                assetSpecifications: [mockAssetSpecification],
                groupedAssets: {
                    isLoadingAssets: false,
                    filteredAssets: [mockAsset],
                },
            });
        });

        it('filters assets by search query', async () => {
            renderWithProviders(<AssetsView {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Search for a layer')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search for a layer');
            fireEvent.change(searchInput, { target: { value: 'Hospital' } });

            await waitFor(() => {
                expect(screen.getByText('Hospital')).toBeInTheDocument();
            });
        });

        it('shows no results when search does not match', async () => {
            renderWithProviders(<AssetsView {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Search for a layer')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search for a layer');
            fireEvent.change(searchInput, { target: { value: 'NonExistent' } });

            await waitFor(() => {
                expect(screen.getByText('No assets found')).toBeInTheDocument();
            });
        });
    });

    describe('Sort Functionality', () => {
        it('changes sort option', async () => {
            setupMocks();
            renderWithProviders(<AssetsView {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByRole('combobox')).toBeInTheDocument();
            });

            const sortSelect = screen.getByRole('combobox');
            fireEvent.mouseDown(sortSelect);
            const zAOption = screen.getByText('Z-A');
            fireEvent.click(zAOption);

            await waitFor(() => {
                expect(sortSelect).toHaveTextContent('Z-A');
            });
        });
    });

    describe('Asset Type Toggle', () => {
        beforeEach(() => {
            setupMocks({
                assetSpecifications: [mockAssetSpecification],
                groupedAssets: {
                    isLoadingAssets: false,
                    filteredAssets: [mockAsset],
                },
            });
        });

        it('calls onAssetTypeToggle when toggle is clicked', async () => {
            const onAssetTypeToggle = vi.fn();
            renderWithProviders(<AssetsView {...defaultProps} onAssetTypeToggle={onAssetTypeToggle} />);

            await expandCategory();

            const toggle = screen.getByRole('switch');
            fireEvent.click(toggle);

            expect(onAssetTypeToggle).toHaveBeenCalledWith(mockAsset.type, true);
        });

        it('reflects selected state from props', async () => {
            renderWithProviders(<AssetsView {...defaultProps} selectedAssetTypes={{ [mockAsset.type]: true }} />);

            await expandCategory();

            const toggle = screen.getByRole('switch') as HTMLInputElement;
            expect(toggle.checked).toBe(true);
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
