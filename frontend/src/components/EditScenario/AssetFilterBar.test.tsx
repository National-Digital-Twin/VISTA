import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import AssetFilterBar, { type AssetFilters } from './AssetFilterBar';
import { fetchAssetCategories } from '@/api/asset-categories';
import theme from '@/theme';

vi.mock('@/api/asset-categories', () => ({
    fetchAssetCategories: vi.fn(),
}));

const mockedFetchAssetCategories = vi.mocked(fetchAssetCategories);

const mockCategories = [
    {
        id: 'cat-1',
        name: 'Health',
        subCategories: [
            {
                id: 'sub-1',
                name: 'Healthcare',
                assetTypes: [
                    { id: 'type-1', name: 'Hospital' },
                    { id: 'type-2', name: 'Clinic' },
                ],
            },
        ],
    },
    {
        id: 'cat-2',
        name: 'Services',
        subCategories: [
            {
                id: 'sub-2',
                name: 'Education',
                assetTypes: [{ id: 'type-3', name: 'School' }],
            },
        ],
    },
];

const defaultFilters: AssetFilters = {
    search: '',
    categoryId: '',
    subCategoryId: '',
    assetTypeId: '',
};

const renderWithProviders = (filters: AssetFilters, onFiltersChange: (f: AssetFilters) => void) => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });

    return render(
        <ThemeProvider theme={theme}>
            <QueryClientProvider client={queryClient}>
                <AssetFilterBar filters={filters} onFiltersChange={onFiltersChange} />
            </QueryClientProvider>
        </ThemeProvider>,
    );
};

beforeEach(() => {
    vi.clearAllMocks();
    mockedFetchAssetCategories.mockResolvedValue(mockCategories);
});

describe('AssetFilterBar', () => {
    it('renders search input', () => {
        const onChange = vi.fn();
        renderWithProviders(defaultFilters, onChange);

        expect(screen.getByPlaceholderText('ID, Asset, Asset type, Sub category...')).toBeInTheDocument();
    });

    it('renders category, sub category, and asset type dropdowns', () => {
        const onChange = vi.fn();
        renderWithProviders(defaultFilters, onChange);

        const comboboxes = screen.getAllByRole('combobox');
        expect(comboboxes).toHaveLength(3);
    });

    it('calls onFiltersChange when search input changes', () => {
        const onChange = vi.fn();
        renderWithProviders(defaultFilters, onChange);

        const input = screen.getByPlaceholderText('ID, Asset, Asset type, Sub category...');
        fireEvent.change(input, { target: { value: 'hospital' } });

        expect(onChange).toHaveBeenCalledWith({ ...defaultFilters, search: 'hospital' });
    });
});
