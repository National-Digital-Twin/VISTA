import { Box, FormControl, InputLabel, MenuItem, Select, type SelectChangeEvent } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchAssetCategories, type AssetCategory } from '@/api/asset-categories';
import { SearchTextField } from '@/components/SearchTextField';

export type AssetFilters = {
    search: string;
    categoryId: string;
    subCategoryId: string;
    assetTypeId: string;
};

type AssetFilterBarProps = {
    filters: AssetFilters;
    onFiltersChange: (filters: AssetFilters) => void;
};

export default function AssetFilterBar({ filters, onFiltersChange }: Readonly<AssetFilterBarProps>) {
    const { data: categories } = useQuery<AssetCategory[]>({
        queryKey: ['assetCategories'],
        queryFn: fetchAssetCategories,
        staleTime: 5 * 60 * 1000,
    });

    const subCategories = useMemo(() => {
        if (!categories || !filters.categoryId) {
            return categories?.flatMap((c) => c.subCategories) ?? [];
        }
        const category = categories.find((c) => c.id === filters.categoryId);
        return category?.subCategories ?? [];
    }, [categories, filters.categoryId]);

    const assetTypes = useMemo(() => {
        if (!filters.subCategoryId) {
            return subCategories.flatMap((sc) => sc.assetTypes);
        }
        const subCategory = subCategories.find((sc) => sc.id === filters.subCategoryId);
        return subCategory?.assetTypes ?? [];
    }, [subCategories, filters.subCategoryId]);

    const handleCategoryChange = (e: SelectChangeEvent) => {
        onFiltersChange({
            ...filters,
            categoryId: e.target.value,
            subCategoryId: '',
            assetTypeId: '',
        });
    };

    const handleSubCategoryChange = (e: SelectChangeEvent) => {
        onFiltersChange({
            ...filters,
            subCategoryId: e.target.value,
            assetTypeId: '',
        });
    };

    const handleAssetTypeChange = (e: SelectChangeEvent) => {
        onFiltersChange({ ...filters, assetTypeId: e.target.value });
    };

    return (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <SearchTextField
                size="small"
                placeholder="Search..."
                value={filters.search}
                onChange={(value) => onFiltersChange({ ...filters, search: value })}
                minWidth={200}
            />

            <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Category</InputLabel>
                <Select value={filters.categoryId} onChange={handleCategoryChange} label="Category">
                    <MenuItem value="">All</MenuItem>
                    {categories?.map((cat) => (
                        <MenuItem key={cat.id} value={cat.id}>
                            {cat.name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Sub category</InputLabel>
                <Select value={filters.subCategoryId} onChange={handleSubCategoryChange} label="Sub category">
                    <MenuItem value="">All</MenuItem>
                    {subCategories.map((sc) => (
                        <MenuItem key={sc.id} value={sc.id}>
                            {sc.name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Asset type</InputLabel>
                <Select value={filters.assetTypeId} onChange={handleAssetTypeChange} label="Asset type">
                    <MenuItem value="">All</MenuItem>
                    {assetTypes.map((at) => (
                        <MenuItem key={at.id} value={at.id}>
                            {at.name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    );
}
