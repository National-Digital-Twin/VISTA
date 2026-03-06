// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { LayersClearOutlined } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
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
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import useAssetFilterMutations from '../hooks/useAssetFilterMutations';
import { isDefaultFilter } from '../hooks/useScoreFilterState';
import FocusAreaSelector from './FocusAreaSelector';
import { GlobalScoreFilter } from './GlobalScoreFilter';
import { ScoreFilterPopup } from './ScoreFilterPopup';
import { fetchAssetScoreFilters, type AssetScoreFilter, type ScoreFilterValues } from '@/api/asset-score-filters';
import type { DataSource } from '@/api/datasources';
import { fetchFocusAreas, type FocusArea } from '@/api/focus-areas';
import { fetchScenarioAssetTypes, type ScenarioAssetCategory, type ScenarioSubCategory, type ScenarioAssetType } from '@/api/scenario-asset-types';
import IconToggle, { type VisibilityState } from '@/components/IconToggle';
import { SearchTextField } from '@/components/SearchTextField';
import StatusPill from '@/components/StatusPill';
import { useDataSources } from '@/hooks/useDataSources';

type AssetsViewProps = {
    readonly onClose: () => void;
    readonly scenarioId?: string;
    readonly selectedFocusAreaId?: string | null;
    readonly onFocusAreaSelect?: (focusAreaId: string | null) => void;
};

type FilterMode = FocusArea['filterMode'];

type SubCategoryItemProps = {
    readonly subCategory: ScenarioSubCategory;
    readonly isExpanded: boolean;
    readonly onToggleExpand: (id: string) => void;
    readonly onToggleVisibility: (assetTypeId: string, isActive: boolean) => void;
    readonly onBulkToggleVisibility: (subCategoryId: string, isActive: boolean) => void;
    readonly onOpenScoreFilter: (assetType: ScenarioAssetType) => void;
    readonly getScoreFilter: (assetTypeId: string) => AssetScoreFilter | undefined;
    readonly isMutating: boolean;
    readonly dataSourceMap: Map<string, DataSource>;
};

function SubCategoryItem({
    subCategory,
    isExpanded,
    onToggleExpand,
    onToggleVisibility,
    onBulkToggleVisibility,
    onOpenScoreFilter,
    getScoreFilter,
    isMutating,
    dataSourceMap,
}: SubCategoryItemProps) {
    const activeCount = subCategory.assetTypes.filter((at) => at.isActive).length;
    const totalCount = subCategory.assetTypes.length;

    const visibilityState: VisibilityState = useMemo(() => {
        if (activeCount === 0) {
            return 'hidden';
        }
        if (activeCount === totalCount) {
            return 'visible';
        }
        return 'partial';
    }, [activeCount, totalCount]);

    const handleExpandClick = () => onToggleExpand(subCategory.id);

    const handleExpandKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggleExpand(subCategory.id);
        }
    };

    const handleBulkToggle = useCallback(
        (e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            e.preventDefault();
            onBulkToggleVisibility(subCategory.id, visibilityState !== 'visible');
        },
        [subCategory.id, visibilityState, onBulkToggleVisibility],
    );

    const getToggleAriaLabel = () => {
        if (visibilityState === 'visible') {
            return `Hide all ${subCategory.name}`;
        }
        return `Show all ${subCategory.name}`;
    };

    return (
        <Box>
            <Box
                sx={{
                    'display': 'flex',
                    'alignItems': 'center',
                    'pl': 2,
                    'pr': 0,
                    'py': 0.75,
                    '&:hover': {
                        backgroundColor: 'action.hover',
                    },
                }}
            >
                <Box
                    onClick={handleExpandClick}
                    onKeyDown={handleExpandKeyDown}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        flex: 1,
                        cursor: 'pointer',
                    }}
                    tabIndex={0}
                    role="button"
                    aria-expanded={isExpanded}
                >
                    {isExpanded ? <KeyboardArrowUpIcon fontSize="small" sx={{ mr: 1 }} /> : <KeyboardArrowDownIcon fontSize="small" sx={{ mr: 1 }} />}
                    <Typography variant="body2">{subCategory.name}</Typography>
                    {activeCount > 0 && (
                        <Box
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: 20,
                                height: 20,
                                px: 0.75,
                                borderRadius: '10px',
                                bgcolor: 'grey.200',
                                color: 'text.primary',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                ml: 1,
                            }}
                        >
                            {activeCount}
                        </Box>
                    )}
                </Box>
                <IconToggle state={visibilityState} onChange={handleBulkToggle} disabled={isMutating} aria-label={getToggleAriaLabel()} size="small" />
            </Box>

            <Collapse in={isExpanded}>
                <AssetTypeList
                    assetTypes={subCategory.assetTypes}
                    onToggle={onToggleVisibility}
                    disabled={isMutating}
                    dataSourceMap={dataSourceMap}
                    onOpenScoreFilter={onOpenScoreFilter}
                    getScoreFilter={getScoreFilter}
                />
            </Collapse>
        </Box>
    );
}

type AssetTypeListItemProps = {
    readonly assetType: ScenarioAssetType;
    readonly onToggle: (assetTypeId: string, isActive: boolean) => void;
    readonly onOpenScoreFilter: (assetType: ScenarioAssetType) => void;
    readonly hasFilter: boolean;
    readonly disabled?: boolean;
    readonly dataSource?: DataSource;
};

function AssetTypeListItem({ assetType, onToggle, onOpenScoreFilter, hasFilter, disabled, dataSource }: AssetTypeListItemProps) {
    const activeCount = hasFilter ? assetType.filteredAssetCount : assetType.assetCountInFocusArea;
    const maxCount = assetType.assetCountTotal;

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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: dataSource ? 0.5 : 0 }}>
                    <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                        {assetType.name}
                    </Typography>
                    <StatusPill isActive={assetType.assetCountInFocusArea > 0} width="100px">
                        <Typography variant="caption" sx={{ color: 'inherit', fontWeight: 'inherit' }}>
                            {activeCount} / {maxCount}
                        </Typography>
                    </StatusPill>
                    <IconButton
                        size="small"
                        onClick={() => onOpenScoreFilter(assetType)}
                        disabled={disabled || assetType.assetCountInFocusArea === 0}
                        aria-label={`Filter ${assetType.name} by score`}
                        sx={{ color: hasFilter ? 'primary.main' : 'inherit', ml: 0 }}
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
                {dataSource && (
                    <Typography variant="caption" color="text.secondary" noWrap component="div" sx={{ cursor: 'default' }}>
                        {dataSource.name}
                    </Typography>
                )}
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
    const sortedAssetTypes = useMemo(() => {
        return [...assetTypes].sort((a, b) => {
            const countA = a.assetCountInFocusArea;
            const countB = b.assetCountInFocusArea;
            return countB - countA;
        });
    }, [assetTypes]);

    return (
        <Box sx={{ pb: 1 }}>
            {sortedAssetTypes.map((assetType) => {
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

    const { data: focusAreas } = useQuery({
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

    const { toggleVisibility, bulkToggleVisibility, clearAll, updateFilterMode, applyScoreFilter, deleteScoreFilter, isFilterModePending, isMutating } =
        useAssetFilterMutations({
            scenarioId,
            selectedFocusAreaId: currentFocusAreaId,
            selectedFilterMode,
            onError: setMutationError,
        });

    useEffect(() => {
        if (focusAreas) {
            const currentScope = focusAreas.find((fa) => fa.id === selectedFocusAreaId);
            if (currentScope) {
                setSelectedFilterMode(currentScope.filterMode);
            }
        }
    }, [focusAreas, selectedFocusAreaId]);

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

    const syncFilterModeIfNeeded = useCallback(() => {
        const currentScope = focusAreas?.find((fa) => fa.id === selectedFocusAreaId);
        if (selectedFilterMode !== currentScope?.filterMode && selectedFocusAreaId) {
            updateFilterMode({ focusAreaId: selectedFocusAreaId, filterMode: selectedFilterMode });
        }
    }, [focusAreas, selectedFocusAreaId, selectedFilterMode, updateFilterMode]);

    const handleToggleVisibility = useCallback(
        (assetTypeId: string, isActive: boolean) => {
            syncFilterModeIfNeeded();
            toggleVisibility({ assetTypeId, isActive });
        },
        [toggleVisibility, syncFilterModeIfNeeded],
    );

    const handleBulkToggleVisibility = useCallback(
        (subCategoryId: string, isActive: boolean) => {
            bulkToggleVisibility({ subCategoryId, isActive });
        },
        [bulkToggleVisibility],
    );

    const handleClearAll = useCallback(() => {
        syncFilterModeIfNeeded();
        clearAll();
    }, [clearAll, syncFilterModeIfNeeded]);

    const handleFilterModeChange = useCallback((event: SelectChangeEvent<string>) => {
        const newMode = event.target.value as FilterMode;
        setSelectedFilterMode(newMode);
    }, []);

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
                syncFilterModeIfNeeded();
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
        [applyScoreFilter, deleteScoreFilter, selectedFocusAreaId, scoreFilterAssetType, handleCloseScoreFilter, syncFilterModeIfNeeded],
    );

    const handleApplyGlobalScoreFilter = useCallback(
        (filter: ScoreFilterValues) => {
            if (!selectedFocusAreaId) {
                return;
            }

            syncFilterModeIfNeeded();

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
        [applyScoreFilter, deleteScoreFilter, selectedFocusAreaId, syncFilterModeIfNeeded],
    );

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

    const hasSelectedScope = !!selectedFocusAreaId;

    const renderContentArea = () => {
        if (!hasSelectedScope) {
            return null;
        }

        if (selectedFilterMode === 'by_score_only') {
            return <GlobalScoreFilter onApply={handleApplyGlobalScoreFilter} initialValues={globalScoreFilter} disabled={isMutating} />;
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

                        {category.subCategories.map((subCategory) => (
                            <SubCategoryItem
                                key={subCategory.id}
                                subCategory={subCategory}
                                isExpanded={expandedSubCategories.has(subCategory.id)}
                                onToggleExpand={toggleSubCategory}
                                onToggleVisibility={handleToggleVisibility}
                                onBulkToggleVisibility={handleBulkToggleVisibility}
                                onOpenScoreFilter={handleOpenScoreFilter}
                                getScoreFilter={getScoreFilterForAssetType}
                                isMutating={isMutating}
                                dataSourceMap={dataSourceMap}
                            />
                        ))}
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
                <Box sx={{ mb: 2 }}>
                    <FocusAreaSelector
                        scenarioId={scenarioId}
                        selectedFocusAreaId={currentFocusAreaId}
                        onFocusAreaSelect={onFocusAreaSelect ?? (() => {})}
                        label="Select focus area"
                    />
                </Box>

                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel id="filter-mode-select-label">Select filter mode</InputLabel>
                    <Select
                        labelId="filter-mode-select-label"
                        value={selectedFilterMode}
                        onChange={handleFilterModeChange}
                        label="Select filter mode"
                        disabled={isMutating || !hasSelectedScope}
                    >
                        <MenuItem value="by_asset_type">By asset type</MenuItem>
                        <MenuItem value="by_score_only">By VISTA score</MenuItem>
                    </Select>
                </FormControl>

                {!hasSelectedScope && (
                    <Typography variant="body2" color="text.secondary">
                        Select a focus area to configure asset filters
                    </Typography>
                )}

                {hasSelectedScope && selectedFilterMode === 'by_asset_type' && (
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
