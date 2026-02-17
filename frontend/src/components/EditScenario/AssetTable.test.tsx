import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from '@mui/material/styles';
import AssetTable from './AssetTable';
import type { DataroomAsset } from '@/api/dataroom-assets';
import theme from '@/theme';

const mockAssets: DataroomAsset[] = [
    {
        id: 'asset-1',
        name: 'Hospital A',
        geometry: { type: 'Point', coordinates: [-3, 51.5] },
        assetTypeId: 'type-1',
        assetTypeName: 'Hospital',
        subCategoryName: 'Healthcare',
        categoryName: 'Health',
        criticalityScore: 8,
        criticalityIsOverridden: false,
    },
    {
        id: 'asset-2',
        name: 'School B',
        geometry: { type: 'Point', coordinates: [-3.1, 51.6] },
        assetTypeId: 'type-2',
        assetTypeName: 'School',
        subCategoryName: 'Education',
        categoryName: 'Services',
        criticalityScore: 5,
        criticalityIsOverridden: false,
    },
    {
        id: 'asset-3',
        name: 'Fire Station C',
        geometry: { type: 'Point', coordinates: [-3.2, 51.7] },
        assetTypeId: 'type-3',
        assetTypeName: 'Fire Station',
        subCategoryName: 'Emergency',
        categoryName: 'Services',
        criticalityScore: 9,
        criticalityIsOverridden: false,
    },
];

const renderAssetTable = (props?: Partial<Parameters<typeof AssetTable>[0]>) => {
    const defaultProps = {
        assets: mockAssets,
        selectedIds: new Set<string>(),
        onSelectionChange: vi.fn(),
        isLoading: false,
    };

    return render(
        <ThemeProvider theme={theme}>
            <AssetTable {...defaultProps} {...props} />
        </ThemeProvider>,
    );
};

describe('AssetTable', () => {
    it('renders loading state', () => {
        renderAssetTable({ isLoading: true });

        expect(screen.getByText('Loading assets...')).toBeInTheDocument();
    });

    it('renders table headers', () => {
        renderAssetTable();

        expect(screen.getByText('ID')).toBeInTheDocument();
        expect(screen.getByText('Asset')).toBeInTheDocument();
        expect(screen.getByText('Asset type')).toBeInTheDocument();
        expect(screen.getByText('Sub category')).toBeInTheDocument();
        expect(screen.getByText('Category')).toBeInTheDocument();
        expect(screen.getByText('Criticality score')).toBeInTheDocument();
    });

    it('renders asset rows', () => {
        renderAssetTable();

        expect(screen.getByText('Hospital A')).toBeInTheDocument();
        expect(screen.getByText('School B')).toBeInTheDocument();
        expect(screen.getByText('Fire Station C')).toBeInTheDocument();
    });

    it('renders asset details in rows', () => {
        renderAssetTable();

        const row = screen.getByText('Hospital A').closest('tr')!;
        const { getByText } = within(row);
        expect(getByText('asset-1')).toBeInTheDocument();
        expect(getByText('Hospital')).toBeInTheDocument();
        expect(getByText('Healthcare')).toBeInTheDocument();
        expect(getByText('Health')).toBeInTheDocument();
        expect(getByText('8')).toBeInTheDocument();
    });

    it('shows empty state when no assets', () => {
        renderAssetTable({ assets: [] });

        expect(screen.getByText('No assets found.')).toBeInTheDocument();
    });

    it('displays "Name unknown" for assets without names', () => {
        const assetsWithNoName = [{ ...mockAssets[0], name: '' }];
        renderAssetTable({ assets: assetsWithNoName });

        expect(screen.getByText('Name unknown')).toBeInTheDocument();
    });

    it('toggles individual row selection on click', () => {
        const onSelectionChange = vi.fn();
        renderAssetTable({ onSelectionChange });

        const row = screen.getByText('Hospital A').closest('tr')!;
        fireEvent.click(row);

        expect(onSelectionChange).toHaveBeenCalledWith(new Set(['asset-1']));
    });

    it('deselects a selected row on click', () => {
        const onSelectionChange = vi.fn();
        renderAssetTable({ selectedIds: new Set(['asset-1']), onSelectionChange });

        const row = screen.getByText('Hospital A').closest('tr')!;
        fireEvent.click(row);

        expect(onSelectionChange).toHaveBeenCalledWith(new Set());
    });

    it('selects all when header checkbox is clicked', () => {
        const onSelectionChange = vi.fn();
        renderAssetTable({ onSelectionChange });

        const headerCheckbox = screen.getAllByRole('checkbox')[0];
        fireEvent.click(headerCheckbox);

        expect(onSelectionChange).toHaveBeenCalledWith(new Set(['asset-1', 'asset-2', 'asset-3']));
    });

    it('deselects all when all are selected and header checkbox is clicked', () => {
        const onSelectionChange = vi.fn();
        renderAssetTable({
            selectedIds: new Set(['asset-1', 'asset-2', 'asset-3']),
            onSelectionChange,
        });

        const headerCheckbox = screen.getAllByRole('checkbox')[0];
        fireEvent.click(headerCheckbox);

        expect(onSelectionChange).toHaveBeenCalledWith(new Set());
    });

    it('shows checked state for selected rows', () => {
        renderAssetTable({ selectedIds: new Set(['asset-1']) });

        const checkboxes = screen.getAllByRole('checkbox');
        // First is header, rest are row checkboxes
        expect(checkboxes[1]).toBeChecked();
        expect(checkboxes[2]).not.toBeChecked();
    });

    it('renders pagination controls', () => {
        renderAssetTable();

        expect(screen.getByText('Rows per page:')).toBeInTheDocument();
    });
});
