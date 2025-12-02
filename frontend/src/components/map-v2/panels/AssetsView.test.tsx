import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import AssetsView from './AssetsView';
import theme from '@/theme';
import { fetchAssetCategories } from '@/api/asset-categories';

vi.mock('@/api/asset-categories', () => ({
    fetchAssetCategories: vi.fn(),
}));

const mockedFetchAssetCategories = vi.mocked(fetchAssetCategories);

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
                    icon?: string;
                }>;
            }>;
        }>;
    }) => {
        const {
            assetCategories = [
                {
                    id: 'cat1',
                    name: 'Healthcare',
                    subCategories: [
                        {
                            id: 'subcat1',
                            name: 'Healthcare Facilities',
                            assetTypes: [
                                {
                                    id: '35a910f3-f611-4096-ac0b-0928c5612e32',
                                    name: 'Hospital',
                                },
                            ],
                        },
                    ],
                },
            ],
        } = options || {};

        mockedFetchAssetCategories.mockResolvedValue(assetCategories as any);
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
        it('shows categories when loaded', async () => {
            setupMocks();
            renderWithProviders(<AssetsView {...defaultProps} />);
            await waitFor(() => {
                const healthcareText = screen.getAllByText(/Healthcare/);
                expect(healthcareText.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Loading State', () => {
        it('shows loading state when categories are loading', async () => {
            const neverResolvingPromise = new Promise<never>(() => {});
            mockedFetchAssetCategories.mockImplementation(() => neverResolvingPromise as Promise<any>);
            renderWithProviders(<AssetsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Loading asset categories...')).toBeInTheDocument();
            });
        });

        it('hides loading state when categories are loaded', async () => {
            setupMocks();
            renderWithProviders(<AssetsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });
        });
    });

    describe('Asset Categories', () => {
        it('displays categories with asset types', async () => {
            setupMocks();
            renderWithProviders(<AssetsView {...defaultProps} />);
            await waitFor(() => {
                const healthcareText = screen.getAllByText(/Healthcare/);
                expect(healthcareText.length).toBeGreaterThan(0);
            });
        });

        it('shows category count', async () => {
            setupMocks();
            renderWithProviders(<AssetsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Healthcare Facilities \(1\)/)).toBeInTheDocument();
            });
        });

        it('shows "No assets found" when no assets match search', async () => {
            setupMocks();
            renderWithProviders(<AssetsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByPlaceholderText('Search for a layer')).toBeInTheDocument();
            });
            const searchInput = screen.getByPlaceholderText('Search for a layer');
            fireEvent.change(searchInput, { target: { value: 'NonExistentCategoryName12345' } });
            await waitFor(() => {
                expect(screen.getByText('No assets found')).toBeInTheDocument();
            });
        });
    });

    describe('Category Expansion', () => {
        beforeEach(() => {
            setupMocks();
        });

        it('expands category when clicked', async () => {
            setupMocks();
            renderWithProviders(<AssetsView {...defaultProps} />);
            await waitFor(() => {
                const healthcareElements = screen.getAllByText(/Healthcare/);
                expect(healthcareElements.length).toBeGreaterThan(0);
            });
            const categoryHeaders = screen.getAllByText(/Healthcare/);
            const categoryHeader =
                categoryHeaders.find((el) => {
                    const typography = el.closest('[class*="MuiTypography-body1"]');
                    const parent = typography?.closest('[class*="MuiBox-root"]');
                    return parent && parent.getAttribute('tabIndex') === '0';
                }) || categoryHeaders[0];
            fireEvent.click(categoryHeader);
            await waitFor(() => {
                expect(screen.getByText(/Healthcare Facilities/)).toBeInTheDocument();
            });
        });

        it('collapses category when clicked again', async () => {
            setupMocks();
            renderWithProviders(<AssetsView {...defaultProps} />);
            await waitFor(() => {
                const healthcareElements = screen.getAllByText(/Healthcare/);
                expect(healthcareElements.length).toBeGreaterThan(0);
            });
            const categoryHeaders = screen.getAllByText(/Healthcare/);
            const categoryHeader =
                categoryHeaders.find((el) => {
                    const typography = el.closest('[class*="MuiTypography-body1"]');
                    const parent = typography?.closest('[class*="MuiBox-root"]');
                    return parent && parent.getAttribute('tabIndex') === '0';
                }) || categoryHeaders[0];
            fireEvent.click(categoryHeader);
            await waitFor(() => {
                expect(screen.getByText(/Healthcare Facilities/)).toBeInTheDocument();
            });
            const subCategoryHeader = screen.getByText(/Healthcare Facilities/);
            fireEvent.click(subCategoryHeader);
            await waitFor(() => {
                expect(screen.getByText('Hospital')).toBeInTheDocument();
            });
            fireEvent.click(categoryHeader);
            await waitFor(() => {
                const collapseElement = categoryHeader.closest('[class*="MuiBox-root"]')?.nextElementSibling;
                const isHidden =
                    collapseElement?.getAttribute('aria-hidden') === 'true' || collapseElement?.classList.toString().includes('MuiCollapse-hidden');
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
            setupMocks();
        });

        it('calls onAssetTypeToggle when toggle is clicked', async () => {
            setupMocks();
            const onAssetTypeToggle = vi.fn();
            renderWithProviders(<AssetsView {...defaultProps} onAssetTypeToggle={onAssetTypeToggle} />);

            await waitFor(() => {
                const healthcareElements = screen.getAllByText(/Healthcare/);
                expect(healthcareElements.length).toBeGreaterThan(0);
            });
            const categoryHeaders = screen.getAllByText(/Healthcare/);
            const categoryHeader =
                categoryHeaders.find((el) => {
                    const typography = el.closest('[class*="MuiTypography-body1"]');
                    const parent = typography?.closest('[class*="MuiBox-root"]');
                    return parent && parent.getAttribute('tabIndex') === '0';
                }) || categoryHeaders[0];
            fireEvent.click(categoryHeader);
            await waitFor(() => {
                expect(screen.getByText(/Healthcare Facilities/)).toBeInTheDocument();
            });
            const subCategoryHeader = screen.getByText(/Healthcare Facilities/);
            fireEvent.click(subCategoryHeader);
            await waitFor(() => {
                expect(screen.getByRole('switch')).toBeInTheDocument();
            });
            const toggle = screen.getByRole('switch');
            fireEvent.click(toggle);

            expect(onAssetTypeToggle).toHaveBeenCalledWith('35a910f3-f611-4096-ac0b-0928c5612e32', true);
        });

        it('reflects selected state from props', async () => {
            setupMocks();
            renderWithProviders(<AssetsView {...defaultProps} selectedAssetTypes={{ '35a910f3-f611-4096-ac0b-0928c5612e32': true }} />);

            await waitFor(() => {
                const healthcareElements = screen.getAllByText(/Healthcare/);
                expect(healthcareElements.length).toBeGreaterThan(0);
            });
            const categoryHeaders = screen.getAllByText(/Healthcare/);
            const categoryHeader =
                categoryHeaders.find((el) => {
                    const typography = el.closest('[class*="MuiTypography-body1"]');
                    const parent = typography?.closest('[class*="MuiBox-root"]');
                    return parent && parent.getAttribute('tabIndex') === '0';
                }) || categoryHeaders[0];
            fireEvent.click(categoryHeader);
            await waitFor(() => {
                expect(screen.getByText(/Healthcare Facilities/)).toBeInTheDocument();
            });
            const subCategoryHeader = screen.getByText(/Healthcare Facilities/);
            fireEvent.click(subCategoryHeader);
            await waitFor(() => {
                expect(screen.getByRole('switch')).toBeInTheDocument();
            });
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
