import { useCallback, useMemo, useState, startTransition } from 'react';
import { Box, IconButton, Typography, MenuItem, Select, Button, ListItem, ListItemText, Collapse } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useQuery } from '@tanstack/react-query';
import { SearchTextField } from '@/components/SearchTextField';
import { fetchAssetCategories, type AssetCategory, type SubCategory, type AssetType } from '@/api/asset-categories';
import ToggleSwitch from '@/components/ToggleSwitch';

interface AssetsViewProps {
    readonly onClose: () => void;
    readonly selectedAssetTypes?: Record<string, boolean>;
    readonly onAssetTypeToggle?: (assetTypeId: string, enabled: boolean) => void;
}

type SortOption = 'a-z' | 'z-a';

interface AssetTypeListItemTextProps {
    readonly assetType: AssetType;
}

function AssetTypeListItemText({ assetType }: AssetTypeListItemTextProps) {
    return (
        <ListItemText
            primary={assetType.name}
            primaryTypographyProps={{
                variant: 'body2',
            }}
        />
    );
}

interface AssetTypeListProps {
    readonly assetTypes: AssetType[];
    readonly selectedAssetTypes: Record<string, boolean>;
    readonly onToggle: (assetTypeId: string) => void;
}

function AssetTypeList({ assetTypes, selectedAssetTypes, onToggle }: AssetTypeListProps) {
    return (
        <Box sx={{ pl: 2, pr: 1, pb: 1 }}>
            {assetTypes.map((assetType) => {
                const isSelected = selectedAssetTypes[assetType.id] || false;
                return (
                    <ListItem
                        key={assetType.id}
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            px: 0,
                            py: 0.5,
                        }}
                    >
                        <AssetTypeListItemText assetType={assetType} />
                        <ToggleSwitch checked={isSelected} onChange={() => onToggle(assetType.id)} inputProps={{ 'aria-label': `Toggle ${assetType.name}` }} />
                    </ListItem>
                );
            })}
        </Box>
    );
}

const AssetsView = ({ onClose, selectedAssetTypes: externalSelectedAssetTypes = {}, onAssetTypeToggle }: AssetsViewProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOption, setSortOption] = useState<SortOption>('a-z');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [expandedSubCategories, setExpandedSubCategories] = useState<Set<string>>(new Set());
    const [localSelectedAssetTypes, setLocalSelectedAssetTypes] = useState<Record<string, boolean>>({});

    const selectedAssetTypes = useMemo(
        () => ({ ...localSelectedAssetTypes, ...externalSelectedAssetTypes }),
        [localSelectedAssetTypes, externalSelectedAssetTypes],
    );

    const {
        data: assetCategories,
        isLoading: isLoadingCategories,
        isError: isErrorCategories,
    } = useQuery({
        queryKey: ['assetCategories'],
        queryFn: fetchAssetCategories,
        staleTime: 5 * 60 * 1000,
    });

    const handleSearchChange = useCallback((value: string) => {
        startTransition(() => {
            setSearchQuery(value);
        });
    }, []);

    const handleSortChange = useCallback((event: { target: { value: unknown } }) => {
        setSortOption(event.target.value as SortOption);
    }, []);

    const toggleCategory = useCallback((categoryId: string) => {
        setExpandedCategories((prev) => {
            const next = new Set(prev);
            next.has(categoryId) ? next.delete(categoryId) : next.add(categoryId);
            return next;
        });
    }, []);

    const toggleSubCategory = useCallback((subCategoryId: string) => {
        setExpandedSubCategories((prev) => {
            const next = new Set(prev);
            next.has(subCategoryId) ? next.delete(subCategoryId) : next.add(subCategoryId);
            return next;
        });
    }, []);

    const toggleAssetType = useCallback(
        (assetTypeId: string) => {
            const newState = !selectedAssetTypes[assetTypeId];
            setLocalSelectedAssetTypes((prev) => {
                const updated = {
                    ...prev,
                    [assetTypeId]: newState,
                };
                return updated;
            });
            onAssetTypeToggle?.(assetTypeId, newState);
        },
        [selectedAssetTypes, onAssetTypeToggle],
    );

    const sortAssetTypes = useCallback((assetTypes: AssetType[], sortDirection: number): AssetType[] => {
        return assetTypes.toSorted((a, b) => sortDirection * a.name.localeCompare(b.name));
    }, []);

    const sortSubCategories = useCallback(
        (subCategories: SubCategory[], sortDirection: number): (SubCategory & { assetTypes: AssetType[] })[] => {
            return subCategories
                .toSorted((a, b) => sortDirection * a.name.localeCompare(b.name))
                .map((subCategory) => ({
                    ...subCategory,
                    assetTypes: sortAssetTypes(subCategory.assetTypes, sortDirection),
                }));
        },
        [sortAssetTypes],
    );

    const sortedCategories = useMemo(() => {
        if (!assetCategories) {
            return [];
        }

        const sortDirection = sortOption === 'a-z' ? 1 : -1;

        return assetCategories
            .map((category) => ({
                ...category,
                subCategories: sortSubCategories(category.subCategories, sortDirection),
            }))
            .toSorted((a, b) => sortDirection * a.name.localeCompare(b.name));
    }, [assetCategories, sortOption, sortSubCategories]);

    const matchesSearch = useCallback((assetType: AssetType, subCategory: SubCategory, category: AssetCategory, searchLower: string): boolean => {
        return (
            assetType.name.toLowerCase().includes(searchLower) ||
            subCategory.name.toLowerCase().includes(searchLower) ||
            category.name.toLowerCase().includes(searchLower)
        );
    }, []);

    const filterSubCategories = useCallback(
        (subCategories: (SubCategory & { assetTypes: AssetType[] })[], category: AssetCategory, searchLower: string) => {
            return subCategories
                .map((subCategory) => {
                    const filteredAssetTypes = subCategory.assetTypes.filter((assetType) => matchesSearch(assetType, subCategory, category, searchLower));
                    return filteredAssetTypes.length > 0 ? { ...subCategory, assetTypes: filteredAssetTypes } : null;
                })
                .filter((subCategory): subCategory is SubCategory & { assetTypes: AssetType[] } => subCategory !== null);
        },
        [matchesSearch],
    );

    const filteredCategories = useMemo(() => {
        if (!sortedCategories || sortedCategories.length === 0) {
            return [];
        }

        if (!searchQuery.trim()) {
            return sortedCategories;
        }

        const searchLower = searchQuery.toLowerCase();
        return sortedCategories
            .map((category) => {
                const filteredSubCategories = filterSubCategories(category.subCategories, category, searchLower);
                return filteredSubCategories.length > 0 ? { ...category, subCategories: filteredSubCategories } : null;
            })
            .filter((category): category is AssetCategory & { subCategories: (SubCategory & { assetTypes: AssetType[] })[] } => category !== null);
    }, [sortedCategories, searchQuery, filterSubCategories]);

    if (isErrorCategories) {
        return (
            <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" fontWeight={600}>
                        Assets
                    </Typography>
                    <IconButton size="small" onClick={onClose} aria-label="Close panel">
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
                <Typography variant="body2" color="text.secondary">
                    Error loading asset categories
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6" fontWeight={600}>
                    Assets
                </Typography>
                <IconButton size="small" onClick={onClose} aria-label="Close panel">
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>

            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ mb: 2 }}>
                    <SearchTextField placeholder="Search for a layer" value={searchQuery} onChange={handleSearchChange} fullWidth />
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Select
                        value={sortOption}
                        onChange={handleSortChange}
                        size="small"
                        sx={{
                            'flex': '1 1 50%',
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'divider',
                            },
                        }}
                    >
                        <MenuItem value="a-z">A-Z</MenuItem>
                        <MenuItem value="z-a">Z-A</MenuItem>
                    </Select>
                    <Button variant="outlined" size="small" disabled sx={{ flex: '1 1 50%' }}>
                        FILTER
                    </Button>
                </Box>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
                {isLoadingCategories && (
                    <Box sx={{ p: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Loading asset categories...
                        </Typography>
                    </Box>
                )}

                {!isLoadingCategories && filteredCategories.length === 0 && (
                    <Box sx={{ p: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            No assets found
                        </Typography>
                    </Box>
                )}

                {filteredCategories.map((category) => {
                    const isCategoryExpanded = expandedCategories.has(category.id);
                    const totalAssetTypes = category.subCategories.reduce((sum, sub) => sum + sub.assetTypes.length, 0);

                    return (
                        <Box key={category.id} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Box
                                onClick={() => toggleCategory(category.id)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        toggleCategory(category.id);
                                    }
                                }}
                                sx={{
                                    'display': 'flex',
                                    'alignItems': 'center',
                                    'p': 1.5,
                                    'cursor': 'pointer',
                                    '&:hover': {
                                        backgroundColor: 'action.hover',
                                    },
                                }}
                                tabIndex={0}
                            >
                                <Typography variant="body1" sx={{ flexGrow: 1, fontWeight: 500 }}>
                                    {category.name} ({totalAssetTypes})
                                </Typography>
                                <IconButton size="small">{isCategoryExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
                            </Box>

                            <Collapse in={isCategoryExpanded}>
                                <Box>
                                    {category.subCategories.map((subCategory) => {
                                        const isSubCategoryExpanded = expandedSubCategories.has(subCategory.id);
                                        return (
                                            <Box key={subCategory.id} sx={{ pl: 2 }}>
                                                <Box
                                                    onClick={() => toggleSubCategory(subCategory.id)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            toggleSubCategory(subCategory.id);
                                                        }
                                                    }}
                                                    sx={{
                                                        'display': 'flex',
                                                        'alignItems': 'center',
                                                        'p': 1.5,
                                                        'cursor': 'pointer',
                                                        '&:hover': {
                                                            backgroundColor: 'action.hover',
                                                        },
                                                    }}
                                                    tabIndex={0}
                                                >
                                                    <Typography variant="body2" sx={{ flexGrow: 1, fontWeight: 500 }}>
                                                        {subCategory.name} ({subCategory.assetTypes.length})
                                                    </Typography>
                                                    <IconButton size="small">{isSubCategoryExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
                                                </Box>

                                                <Collapse in={isSubCategoryExpanded}>
                                                    <AssetTypeList
                                                        assetTypes={subCategory.assetTypes}
                                                        selectedAssetTypes={selectedAssetTypes}
                                                        onToggle={toggleAssetType}
                                                    />
                                                </Collapse>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Collapse>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
};

export default AssetsView;
