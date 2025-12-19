import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Box,
    CircularProgress,
    Collapse,
    FormControl,
    IconButton,
    InputLabel,
    ListItem,
    MenuItem,
    Portal,
    Select,
    Snackbar,
    Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useQuery } from '@tanstack/react-query';
import { LayersClearOutlined } from '@mui/icons-material';
import useAssetFilterMutations from '../hooks/useAssetFilterMutations';
import { isDefaultFilter } from '../hooks/useScoreFilterState';
import { GlobalScoreFilter } from './GlobalScoreFilter';
import { ScoreFilterPopup } from './ScoreFilterPopup';
import { SearchTextField } from '@/components/SearchTextField';
import IconToggle from '@/components/IconToggle';
import { useDataSources } from '@/hooks/useDataSources';
import { fetchFocusAreas, type FocusArea } from '@/api/focus-areas';
import { fetchAssetScoreFilters, type AssetScoreFilter, type ScoreFilterValues } from '@/api/asset-score-filters';
import type { DataSource } from '@/api/datasources';
import { fetchScenarioAssetTypes, type ScenarioAssetCategory, type ScenarioSubCategory, type ScenarioAssetType } from '@/api/scenario-asset-types';

type AssetsViewProps = {
    readonly onClose: () => void;
    readonly scenarioId?: string;
    readonly selectedFocusAreaId?: string | null;
    readonly onFocusAreaSelect?: (focusAreaId: string | null) => void;
};

type FilterMode = FocusArea['filterMode'];

type AssetTypeListItemProps = {
    readonly assetType: ScenarioAssetType;
    readonly onToggle: (assetTypeId: string, isActive: boolean) => void;
    readonly onOpenScoreFilter: (assetType: ScenarioAssetType) => void;
    readonly hasFilter: boolean;
    readonly disabled?: boolean;
    readonly dataSource?: DataSource;
};

function AssetTypeListItem({ assetType, onToggle, onOpenScoreFilter, hasFilter, disabled, dataSource }: AssetTypeListItemProps) {
    const countDisplay = hasFilter ? `(${assetType.filteredAssetCount}/${assetType.assetCount})` : `(${assetType.assetCount})`;

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
                    {assetType.name} {countDisplay}
                </Typography>
                {dataSource && (
                    <Typography variant="caption" color="text.secondary" noWrap component="div" sx={{ cursor: 'default' }}>
                        {dataSource.name}
                    </Typography>
                )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton
                    size="small"
                    onClick={() => onOpenScoreFilter(assetType)}
                    disabled={disabled}
                    aria-label={`Filter ${assetType.name} by score`}
                    sx={{ color: hasFilter ? 'primary.main' : 'inherit' }}
                >
                    <FilterListIcon fontSize="small" />
                </IconButton>
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

AssetTypeListItem.displayName = 'AssetTypeListItem';

type AssetTypeListProps = {
    readonly assetTypes: ScenarioAssetType[];
    readonly onToggle: (assetTypeId: string, isActive: boolean) => void;
    readonly onOpenScoreFilter: (assetType: ScenarioAssetType) => void;
    readonly getScoreFilter: (assetTypeId: string) => AssetScoreFilter | undefined;
    readonly disabled?: boolean;
    readonly dataSourceMap: Map<string, DataSource>;
};

function AssetTypeList({ assetTypes, onToggle, onOpenScoreFilter, getScoreFilter, disabled, dataSourceMap }: AssetTypeListProps) {
    return (
        <Box sx={{ pb: 1 }}>
            {assetTypes.map((assetType) => {
                const dataSource = assetType.datasourceId ? dataSourceMap.get(assetType.datasourceId) : undefined;
                const hasFilter = getScoreFilter(assetType.id) !== undefined;
                return (
                    <AssetTypeListItem
                        key={assetType.id}
                        assetType={assetType}
                        onToggle={onToggle}
                        onOpenScoreFilter={onOpenScoreFilter}
                        hasFilter={hasFilter}
                        disabled={disabled}
                        dataSource={dataSource}
                    />
                );
            })}
        </Box>
    );
}

AssetTypeList.displayName = 'AssetTypeList';

const AssetsView = ({ onClose, scenarioId, selectedFocusAreaId, onFocusAreaSelect }: AssetsViewProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const deferredSearchQuery = useDeferredValue(searchQuery);
    const [expandedSubCategories, setExpandedSubCategories] = useState<Set<string>>(new Set());
    const [mutationError, setMutationError] = useState<string | null>(null);
    const { dataSourceMap } = useDataSources();
    const currentFocusAreaId = selectedFocusAreaId ?? null;

    const [selectedFilterMode, setSelectedFilterMode] = useState<FilterMode>('by_asset_type');
    const [scoreFilterPopupOpen, setScoreFilterPopupOpen] = useState(false);
    const [scoreFilterAssetType, setScoreFilterAssetType] = useState<ScenarioAssetType | null>(null);

    const { data: focusAreas, isLoading: isLoadingFocusAreas } = useQuery({
        queryKey: ['focusAreas', scenarioId],
        queryFn: () => fetchFocusAreas(scenarioId!),
        enabled: !!scenarioId,
        staleTime: 5 * 60 * 1000,
    });

    const { data: scoreFilters } = useQuery({
        queryKey: ['assetScoreFilters', scenarioId],
        queryFn: () => fetchAssetScoreFilters(scenarioId!),
        enabled: !!scenarioId,
        staleTime: 5 * 60 * 1000,
    });

    const {
        data: assetCategories,
        isLoading: isLoadingCategories,
        isError: isErrorCategories,
    } = useQuery({
        queryKey: ['scenarioAssetTypes', scenarioId, currentFocusAreaId],
        queryFn: () => fetchScenarioAssetTypes(scenarioId!, currentFocusAreaId),
        enabled: !!scenarioId,
        staleTime: 5 * 60 * 1000,
    });

    const { toggleVisibility, clearAll, updateFilterMode, applyScoreFilter, deleteScoreFilter, isFilterModePending, isMutating } = useAssetFilterMutations({
        scenarioId,
        selectedFocusAreaId: currentFocusAreaId,
        selectedFilterMode,
        onError: setMutationError,
    });

    // Update selected filter mode when focus areas data loads or selected focus area changes
    // Also auto-select first active focus area if current selection is inactive
    useEffect(() => {
        if (focusAreas) {
            const currentScope = focusAreas.find((fa) => fa.id === selectedFocusAreaId);
            if (!currentScope?.isActive) {
                // Current selection is inactive, select the first active focus area
                const firstActiveScope = focusAreas.find((fa) => fa.isActive);
                if (firstActiveScope) {
                    onFocusAreaSelect?.(firstActiveScope.id);
                    setSelectedFilterMode(firstActiveScope.filterMode);
                } else {
                    // No active focus areas - clear the selection
                    onFocusAreaSelect?.(null);
                }
                return;
            }
            if (currentScope) {
                setSelectedFilterMode(currentScope.filterMode);
            }
        }
    }, [focusAreas, selectedFocusAreaId, onFocusAreaSelect]);

    // Expand subcategories that have visible asset types - only on initial load or focus area change
    const lastFocusAreaIdRef = useRef<string | null | undefined>(undefined);
    useEffect(() => {
        if (!assetCategories) {
            return;
        }

        if (lastFocusAreaIdRef.current === currentFocusAreaId) {
            return;
        }
        lastFocusAreaIdRef.current = currentFocusAreaId;

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
    }, [assetCategories, currentFocusAreaId]);

    const handleFocusAreaChange = useCallback(
        (event: SelectChangeEvent<string>) => {
            const newFocusAreaId = event.target.value || null;
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
            toggleVisibility({ assetTypeId, isActive });
        },
        [toggleVisibility],
    );

    const handleClearAll = useCallback(() => {
        clearAll();
    }, [clearAll]);

    const handleFilterModeChange = useCallback(
        (event: SelectChangeEvent<string>) => {
            const newMode = event.target.value as FilterMode;
            if (selectedFocusAreaId) {
                updateFilterMode({ focusAreaId: selectedFocusAreaId, filterMode: newMode });
            }
        },
        [updateFilterMode, selectedFocusAreaId],
    );

    const handleOpenScoreFilter = useCallback((assetType: ScenarioAssetType) => {
        setScoreFilterAssetType(assetType);
        setScoreFilterPopupOpen(true);
    }, []);

    const handleCloseScoreFilter = useCallback(() => {
        setScoreFilterPopupOpen(false);
        setScoreFilterAssetType(null);
    }, []);

    const handleApplyScoreFilter = useCallback(
        (filter: ScoreFilterValues) => {
            if (scoreFilterAssetType) {
                if (isDefaultFilter(filter)) {
                    deleteScoreFilter({
                        focusAreaId: selectedFocusAreaId ?? null,
                        assetTypeId: scoreFilterAssetType.id,
                    });
                } else {
                    applyScoreFilter({
                        focusAreaId: selectedFocusAreaId ?? null,
                        assetTypeId: scoreFilterAssetType.id,
                        filter,
                    });
                }
            }
            handleCloseScoreFilter();
        },
        [applyScoreFilter, deleteScoreFilter, selectedFocusAreaId, scoreFilterAssetType, handleCloseScoreFilter],
    );

    const handleApplyGlobalScoreFilter = useCallback(
        (filter: ScoreFilterValues) => {
            if (isDefaultFilter(filter)) {
                deleteScoreFilter({
                    focusAreaId: selectedFocusAreaId ?? null,
                    assetTypeId: null,
                });
            } else {
                applyScoreFilter({
                    focusAreaId: selectedFocusAreaId ?? null,
                    assetTypeId: null,
                    filter,
                });
            }
        },
        [applyScoreFilter, deleteScoreFilter, selectedFocusAreaId],
    );

    const handleClearGlobalScoreFilter = useCallback(() => {
        deleteScoreFilter({
            focusAreaId: selectedFocusAreaId ?? null,
            assetTypeId: null,
        });
    }, [deleteScoreFilter, selectedFocusAreaId]);

    const getScoreFilterForAssetType = useCallback(
        (assetTypeId: string): AssetScoreFilter | undefined => {
            return scoreFilters?.find((sf) => sf.focusAreaId === selectedFocusAreaId && sf.assetTypeId === assetTypeId);
        },
        [scoreFilters, selectedFocusAreaId],
    );

    const globalScoreFilter = useMemo(() => {
        return scoreFilters?.find((sf) => sf.focusAreaId === selectedFocusAreaId && sf.assetTypeId === null);
    }, [scoreFilters, selectedFocusAreaId]);

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

    const focusAreaSelectValue = focusAreas && currentFocusAreaId ? currentFocusAreaId : '';
    const hasActiveScope = focusAreas?.some((fa) => fa.isActive) ?? false;

    const renderContentArea = () => {
        if (!hasActiveScope) {
            return null;
        }

        if (selectedFilterMode === 'by_score_only') {
            return (
                <GlobalScoreFilter
                    onApply={handleApplyGlobalScoreFilter}
                    onClear={handleClearGlobalScoreFilter}
                    initialValues={globalScoreFilter}
                    disabled={isMutating}
                />
            );
        }

        return (
            <>
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
                                                e.preventDefault();
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
                                        role="button"
                                        aria-expanded={isSubCategoryExpanded}
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
                                            onOpenScoreFilter={handleOpenScoreFilter}
                                            getScoreFilter={getScoreFilterForAssetType}
                                        />
                                    </Collapse>
                                </Box>
                            );
                        })}
                    </Box>
                ))}
            </>
        );
    };

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
                        {focusAreas?.map((fa) => (
                            <MenuItem key={fa.id} value={fa.id} disabled={!fa.isActive}>
                                {fa.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel id="filter-mode-select-label">Select filter mode</InputLabel>
                    <Select
                        labelId="filter-mode-select-label"
                        value={selectedFilterMode}
                        onChange={handleFilterModeChange}
                        label="Select filter mode"
                        disabled={isMutating || !hasActiveScope}
                    >
                        <MenuItem value="by_asset_type">By asset type</MenuItem>
                        <MenuItem value="by_score_only">By VISTA score</MenuItem>
                    </Select>
                </FormControl>

                {!hasActiveScope && (
                    <Typography variant="body2" color="text.secondary">
                        Enable a focus area or map-wide visibility to configure asset filters
                    </Typography>
                )}

                {hasActiveScope && selectedFilterMode === 'by_asset_type' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ flex: 1 }}>
                            <SearchTextField placeholder="Search for an asset" value={searchQuery} onChange={handleSearchChange} fullWidth />
                        </Box>
                        <IconButton size="small" onClick={handleClearAll} disabled={isMutating} aria-label="Clear all visible assets" title="Clear all">
                            <LayersClearOutlined fontSize="small" />
                        </IconButton>
                    </Box>
                )}
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
                {isFilterModePending && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(255, 255, 255, 0.7)',
                            zIndex: 1,
                        }}
                    >
                        <CircularProgress size={32} />
                    </Box>
                )}
                {renderContentArea()}
            </Box>

            {scoreFilterPopupOpen && scoreFilterAssetType && (
                <ScoreFilterPopup
                    key={scoreFilterAssetType.id}
                    open={scoreFilterPopupOpen}
                    onClose={handleCloseScoreFilter}
                    onApply={handleApplyScoreFilter}
                    assetTypeName={scoreFilterAssetType.name}
                    initialValues={getScoreFilterForAssetType(scoreFilterAssetType.id)}
                />
            )}

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
