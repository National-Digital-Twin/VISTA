import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box, Collapse, FormControl, IconButton, InputLabel, ListItem, MenuItem, Portal, Select, Snackbar, Typography } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LayersClearOutlined } from '@mui/icons-material';
import { SearchTextField } from '@/components/SearchTextField';
import IconToggle from '@/components/IconToggle';
import { useDataSources } from '@/hooks/useDataSources';
import { fetchFocusAreas, type FocusArea } from '@/api/focus-areas';
import type { DataSource } from '@/api/datasources';
import {
    fetchScenarioAssetTypes,
    toggleAssetTypeVisibility,
    clearAllAssetTypeVisibility,
    type ScenarioAssetCategory,
    type ScenarioSubCategory,
    type ScenarioAssetType,
} from '@/api/scenario-asset-types';

type AssetsViewProps = {
    readonly onClose: () => void;
    readonly scenarioId?: string;
    readonly onFocusAreaSelect?: (focusAreaId: string | null) => void;
};

const MAP_WIDE_VALUE = '__map_wide__';

type AssetTypeListItemProps = {
    readonly assetType: ScenarioAssetType;
    readonly onToggle: (assetTypeId: string, isActive: boolean) => void;
    readonly disabled?: boolean;
    readonly dataSource?: DataSource;
};

function AssetTypeListItem({ assetType, onToggle, disabled, dataSource }: AssetTypeListItemProps) {
    return (
        <ListItem
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                pl: 6,
                pr: 0,
                py: 0.5,
            }}
        >
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" noWrap>
                    {assetType.name} ({assetType.assetCount})
                </Typography>
                {dataSource && (
                    <Typography variant="caption" color="text.secondary" noWrap component="div" sx={{ cursor: 'default' }}>
                        {dataSource.name}
                    </Typography>
                )}
            </Box>
            <Box sx={{ display: 'flex' }}>
                <IconToggle
                    checked={assetType.isActive}
                    onChange={() => onToggle(assetType.id, !assetType.isActive)}
                    disabled={disabled}
                    aria-label={assetType.isActive ? `Hide ${assetType.name}` : `Show ${assetType.name}`}
                    size="small"
                />
            </Box>
        </ListItem>
    );
}

type AssetTypeListProps = {
    readonly assetTypes: ScenarioAssetType[];
    readonly onToggle: (assetTypeId: string, isActive: boolean) => void;
    readonly disabled?: boolean;
    readonly dataSourceMap: Map<string, DataSource>;
};

function AssetTypeList({ assetTypes, onToggle, disabled, dataSourceMap }: AssetTypeListProps) {
    return (
        <Box sx={{ pb: 1 }}>
            {assetTypes.map((assetType) => {
                const dataSource = assetType.datasourceId ? dataSourceMap.get(assetType.datasourceId) : undefined;
                return <AssetTypeListItem key={assetType.id} assetType={assetType} onToggle={onToggle} disabled={disabled} dataSource={dataSource} />;
            })}
        </Box>
    );
}

const AssetsView = ({ onClose, scenarioId, onFocusAreaSelect }: AssetsViewProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const deferredSearchQuery = useDeferredValue(searchQuery);
    const [expandedSubCategories, setExpandedSubCategories] = useState<Set<string>>(new Set());
    const [selectedFocusAreaId, setSelectedFocusAreaId] = useState<string | null>(null);
    const [mutationError, setMutationError] = useState<string | null>(null);
    const queryClient = useQueryClient();
    const { dataSourceMap } = useDataSources();

    const { data: focusAreas, isLoading: isLoadingFocusAreas } = useQuery({
        queryKey: ['focusAreas', scenarioId],
        queryFn: () => fetchFocusAreas(scenarioId!),
        enabled: !!scenarioId,
        staleTime: 5 * 60 * 1000,
    });

    const {
        data: assetCategories,
        isLoading: isLoadingCategories,
        isError: isErrorCategories,
    } = useQuery({
        queryKey: ['scenarioAssetTypes', scenarioId, selectedFocusAreaId],
        queryFn: () => fetchScenarioAssetTypes(scenarioId!, selectedFocusAreaId),
        enabled: !!scenarioId,
        staleTime: 5 * 60 * 1000,
    });

    const visibilityMutation = useMutation({
        mutationFn: (data: { assetTypeId: string; isActive: boolean }) =>
            toggleAssetTypeVisibility(scenarioId!, {
                assetTypeId: data.assetTypeId,
                focusAreaId: selectedFocusAreaId,
                isActive: data.isActive,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scenarioAssetTypes', scenarioId] });
            queryClient.invalidateQueries({ queryKey: ['scenarioAssets', scenarioId] });
        },
        onError: () => {
            setMutationError('Failed to update asset type visibility');
        },
    });

    const clearAllMutation = useMutation({
        mutationFn: () => clearAllAssetTypeVisibility(scenarioId!, selectedFocusAreaId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scenarioAssetTypes', scenarioId] });
            queryClient.invalidateQueries({ queryKey: ['scenarioAssets', scenarioId] });
        },
        onError: () => {
            setMutationError('Failed to clear asset type visibility');
        },
    });

    // Expand subcategories that have visible asset types - only on initial load or focus area change
    const lastFocusAreaIdRef = useRef<string | null | undefined>(undefined);
    useEffect(() => {
        if (!assetCategories) {
            return;
        }

        if (lastFocusAreaIdRef.current === selectedFocusAreaId) {
            return;
        }
        lastFocusAreaIdRef.current = selectedFocusAreaId;

        const visibleSubCategoryIds = new Set<string>();
        for (const category of assetCategories) {
            for (const subCategory of category.subCategories) {
                const hasVisibleAssets = subCategory.assetTypes.some((at) => at.isActive);
                if (hasVisibleAssets) {
                    visibleSubCategoryIds.add(subCategory.id);
                }
            }
        }
        setExpandedSubCategories(visibleSubCategoryIds);
    }, [assetCategories, selectedFocusAreaId]);

    const handleFocusAreaChange = useCallback(
        (event: SelectChangeEvent<string>) => {
            const value = event.target.value;
            const newFocusAreaId = value === MAP_WIDE_VALUE ? null : value;
            setSelectedFocusAreaId(newFocusAreaId);
            onFocusAreaSelect?.(newFocusAreaId);
        },
        [onFocusAreaSelect],
    );

    const handleSearchChange = useCallback((value: string) => {
        setSearchQuery(value);
    }, []);

    const toggleSubCategory = useCallback((subCategoryId: string) => {
        setExpandedSubCategories((prev) => {
            const next = new Set(prev);
            next.has(subCategoryId) ? next.delete(subCategoryId) : next.add(subCategoryId);
            return next;
        });
    }, []);

    const handleToggleVisibility = useCallback(
        (assetTypeId: string, isActive: boolean) => {
            visibilityMutation.mutate({ assetTypeId, isActive });
        },
        [visibilityMutation],
    );

    const handleClearAll = useCallback(() => {
        clearAllMutation.mutate();
    }, [clearAllMutation]);

    const matchesSearch = useCallback(
        (assetType: ScenarioAssetType, subCategory: ScenarioSubCategory, category: ScenarioAssetCategory, searchLower: string): boolean => {
            return (
                assetType.name.toLowerCase().includes(searchLower) ||
                subCategory.name.toLowerCase().includes(searchLower) ||
                category.name.toLowerCase().includes(searchLower)
            );
        },
        [],
    );

    const filterSubCategories = useCallback(
        (subCategories: ScenarioSubCategory[], category: ScenarioAssetCategory, searchLower: string) => {
            return subCategories
                .map((subCategory) => {
                    const filteredAssetTypes = subCategory.assetTypes.filter((assetType) => matchesSearch(assetType, subCategory, category, searchLower));
                    return filteredAssetTypes.length > 0 ? { ...subCategory, assetTypes: filteredAssetTypes } : null;
                })
                .filter((subCategory): subCategory is ScenarioSubCategory => subCategory !== null);
        },
        [matchesSearch],
    );

    const filteredCategories = useMemo(() => {
        if (!assetCategories || assetCategories.length === 0) {
            return [];
        }

        if (!deferredSearchQuery.trim()) {
            return assetCategories;
        }

        const searchLower = deferredSearchQuery.toLowerCase();
        return assetCategories
            .map((category) => {
                const filteredSubCategories = filterSubCategories(category.subCategories, category, searchLower);
                return filteredSubCategories.length > 0 ? { ...category, subCategories: filteredSubCategories } : null;
            })
            .filter((category): category is ScenarioAssetCategory => category !== null);
    }, [assetCategories, deferredSearchQuery, filterSubCategories]);

    const focusAreaSelectValue = selectedFocusAreaId ?? MAP_WIDE_VALUE;
    const isMutating = visibilityMutation.isPending || clearAllMutation.isPending;

    if (!scenarioId) {
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
                    No scenario selected
                </Typography>
            </Box>
        );
    }

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
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel id="focus-area-select-label">Select visible focus area</InputLabel>
                    <Select
                        labelId="focus-area-select-label"
                        value={focusAreaSelectValue}
                        onChange={handleFocusAreaChange}
                        label="Select visible focus area"
                        disabled={isLoadingFocusAreas}
                    >
                        <MenuItem value={MAP_WIDE_VALUE}>Map wide</MenuItem>
                        {focusAreas?.map((fa: FocusArea) => (
                            <MenuItem key={fa.id} value={fa.id} disabled={!fa.isActive}>
                                {fa.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel id="filter-mode-select-label">Select filter mode</InputLabel>
                    <Select labelId="filter-mode-select-label" value="by-asset-type" label="Select filter mode" disabled>
                        <MenuItem value="by-asset-type">By asset type</MenuItem>
                    </Select>
                </FormControl>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ flex: 1 }}>
                        <SearchTextField placeholder="Search for an asset" value={searchQuery} onChange={handleSearchChange} fullWidth />
                    </Box>
                    <IconButton size="small" onClick={handleClearAll} disabled={isMutating} aria-label="Clear all visible assets" title="Clear all">
                        <LayersClearOutlined fontSize="small" />
                    </IconButton>
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

                {filteredCategories.map((category) => (
                    <Box key={category.id}>
                        <Typography
                            variant="caption"
                            sx={{
                                display: 'block',
                                px: 2,
                                pt: 2,
                                pb: 0.5,
                                fontWeight: 600,
                                color: 'text.secondary',
                                textTransform: 'none',
                            }}
                        >
                            {category.name}
                        </Typography>

                        {category.subCategories.map((subCategory) => {
                            const isSubCategoryExpanded = expandedSubCategories.has(subCategory.id);
                            const activeCount = subCategory.assetTypes.filter((at) => at.isActive).length;
                            return (
                                <Box key={subCategory.id}>
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
                                            'px': 2,
                                            'py': 0.75,
                                            'cursor': 'pointer',
                                            '&:hover': {
                                                backgroundColor: 'action.hover',
                                            },
                                        }}
                                        tabIndex={0}
                                    >
                                        {isSubCategoryExpanded ? (
                                            <KeyboardArrowUpIcon fontSize="small" sx={{ mr: 1 }} />
                                        ) : (
                                            <KeyboardArrowDownIcon fontSize="small" sx={{ mr: 1 }} />
                                        )}
                                        <Typography variant="body2">
                                            {subCategory.name}
                                            {activeCount > 0 && ` (${activeCount})`}
                                        </Typography>
                                    </Box>

                                    <Collapse in={isSubCategoryExpanded}>
                                        <AssetTypeList
                                            assetTypes={subCategory.assetTypes}
                                            onToggle={handleToggleVisibility}
                                            disabled={isMutating}
                                            dataSourceMap={dataSourceMap}
                                        />
                                    </Collapse>
                                </Box>
                            );
                        })}
                    </Box>
                ))}
            </Box>

            <Portal>
                <Snackbar
                    open={!!mutationError}
                    autoHideDuration={5000}
                    onClose={() => setMutationError(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                    <Alert severity="error" onClose={() => setMutationError(null)}>
                        {mutationError}
                    </Alert>
                </Snackbar>
            </Portal>
        </Box>
    );
};

export default AssetsView;
