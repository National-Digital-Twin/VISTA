import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

        expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
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

        const input = screen.getByPlaceholderText('Search...');
        fireEvent.change(input, { target: { value: 'hospital' } });

        expect(onChange).toHaveBeenCalledWith({ ...defaultFilters, search: 'hospital' });
    });

    it('resets sub-category and asset type when category changes', async () => {
        const onChange = vi.fn();
        renderWithProviders({ ...defaultFilters, subCategoryId: 'sub-1', assetTypeId: 'type-1' }, onChange);

        await waitFor(() => {
            expect(mockedFetchAssetCategories).toHaveBeenCalled();
        });
        const [categorySelect] = screen.getAllByRole('combobox');
        fireEvent.mouseDown(categorySelect);
        fireEvent.click(await screen.findByRole('option', { name: 'Health' }));

        expect(onChange).toHaveBeenCalledWith({
            ...defaultFilters,
            categoryId: 'cat-1',
            subCategoryId: '',
            assetTypeId: '',
        });
    });

    it('resets asset type when sub-category changes', async () => {
        const onChange = vi.fn();
        renderWithProviders({ ...defaultFilters, categoryId: 'cat-1', assetTypeId: 'type-1' }, onChange);

        await waitFor(() => {
            expect(mockedFetchAssetCategories).toHaveBeenCalled();
        });
        const [, subCategorySelect] = screen.getAllByRole('combobox');
        fireEvent.mouseDown(subCategorySelect);
        fireEvent.click(await screen.findByRole('option', { name: 'Healthcare' }));

        expect(onChange).toHaveBeenCalledWith({
            ...defaultFilters,
            categoryId: 'cat-1',
            subCategoryId: 'sub-1',
            assetTypeId: '',
        });
    });

    it('updates asset type when asset type changes', async () => {
        const onChange = vi.fn();
        renderWithProviders({ ...defaultFilters, categoryId: 'cat-1', subCategoryId: 'sub-1' }, onChange);

        await waitFor(() => {
            expect(mockedFetchAssetCategories).toHaveBeenCalled();
        });
        const [, , assetTypeSelect] = screen.getAllByRole('combobox');
        fireEvent.mouseDown(assetTypeSelect);
        fireEvent.click(await screen.findByRole('option', { name: 'Hospital' }));

        expect(onChange).toHaveBeenCalledWith({
            ...defaultFilters,
            categoryId: 'cat-1',
            subCategoryId: 'sub-1',
            assetTypeId: 'type-1',
        });
    });
});
