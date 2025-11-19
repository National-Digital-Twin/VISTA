import { useCallback, useMemo, useState, startTransition } from 'react';
import { Box, IconButton, Typography, MenuItem, Select, Button, ListItem, ListItemText, Collapse, Backdrop, LinearProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { SearchTextField } from '@/components/SearchTextField';
import { fetchAssessments } from '@/api/assessments';
import { fetchAssetSpecifications } from '@/api/fetchAssetSpecifications';
import { useGroupedAssets } from '@/hooks';
import { capitalize } from '@/utils/capitalize';
import ToggleSwitch from '@/components/ToggleSwitch';

interface AssetsViewProps {
    readonly onClose: () => void;
    readonly selectedAssetTypes?: Record<string, boolean>;
    readonly onAssetTypeToggle?: (assetType: string, enabled: boolean) => void;
}

type SortOption = 'a-z' | 'z-a';

function formatAltText(altText: string): string {
    return altText.replaceAll(/([A-Z])/g, ' $1').trim();
}

function getDataSourceName(source: string): string {
    const sourceMap: Record<string, string> = {
        os_names: 'OS Names',
        os_ngd: 'OS NGD Buildings',
        os_ngd_structure: 'OS NGD Structure',
        os_ngd_water: 'OS NGD Water',
    };
    return sourceMap[source] || source;
}

interface AssetTypeData {
    readonly type: string;
    readonly count: number;
    readonly styles: {
        readonly alt: string;
        readonly backgroundColor?: string;
        readonly color?: string;
        readonly iconFallbackText?: string;
    };
    readonly source?: string;
}

interface CategoryData {
    readonly category: string;
    readonly assetTypes: AssetTypeData[];
}

interface AssetTypeListItemTextProps {
    readonly assetType: AssetTypeData;
}

function AssetTypeListItemText({ assetType }: AssetTypeListItemTextProps) {
    const dateString = useMemo(() => {
        const now = new Date();
        const datePart = now.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
        const timePart = now.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
        return `${assetType.source ? getDataSourceName(assetType.source) : 'OS Names'} - ${datePart} @ ${timePart}`;
    }, [assetType.source]);

    return (
        <ListItemText
            primary={capitalize(formatAltText(assetType.styles.alt))}
            secondary={dateString}
            primaryTypographyProps={{
                variant: 'body2',
            }}
            secondaryTypographyProps={{
                variant: 'caption',
                color: 'text.secondary',
            }}
        />
    );
}

const AssetsView = ({ onClose, selectedAssetTypes: externalSelectedAssetTypes = {}, onAssetTypeToggle }: AssetsViewProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOption, setSortOption] = useState<SortOption>('a-z');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [localSelectedAssetTypes, setLocalSelectedAssetTypes] = useState<Record<string, boolean>>({});

    const selectedAssetTypes = useMemo(
        () => ({ ...localSelectedAssetTypes, ...externalSelectedAssetTypes }),
        [localSelectedAssetTypes, externalSelectedAssetTypes],
    );

    const { isError: isErrorAssessments, data: assessmentsData } = useSuspenseQuery({
        queryKey: ['assessments'],
        queryFn: fetchAssessments,
    });

    const { data: assetSpecifications } = useQuery({
        queryKey: ['assetSpecifications'],
        queryFn: fetchAssetSpecifications,
    });

    const assessment = assessmentsData?.at(0)?.uri;

    const groupedAssetsResult = useGroupedAssets({
        assessment: assessment || undefined,
        searchFilter: searchQuery,
    });

    const isLoadingAssets = groupedAssetsResult.isLoadingAssets;
    const progress = 'progress' in groupedAssetsResult ? groupedAssetsResult.progress : 0;

    const filteredAssets = useMemo(() => groupedAssetsResult.filteredAssets || [], [groupedAssetsResult.filteredAssets]);

    const assetSpecMap = useMemo(() => {
        if (!assetSpecifications) {
            return new Map<string, { source?: string }>();
        }
        return new Map(assetSpecifications.map((spec: { type: string; source?: string }) => [spec.type, { source: spec.source }]));
    }, [assetSpecifications]);

    const handleSearchChange = useCallback((value: string) => {
        startTransition(() => {
            setSearchQuery(value);
        });
    }, []);

    const handleSortChange = useCallback((event: { target: { value: unknown } }) => {
        setSortOption(event.target.value as SortOption);
    }, []);

    const toggleCategory = useCallback((category: string) => {
        setExpandedCategories((prev) => {
            const next = new Set(prev);
            next.has(category) ? next.delete(category) : next.add(category);
            return next;
        });
    }, []);

    const toggleAssetType = useCallback(
        (assetType: string) => {
            const newState = !selectedAssetTypes[assetType];
            setLocalSelectedAssetTypes((prev) => {
                const updated = {
                    ...prev,
                    [assetType]: newState,
                };
                return updated;
            });
            onAssetTypeToggle?.(assetType, newState);
        },
        [selectedAssetTypes, onAssetTypeToggle],
    );

    const categories = useMemo(() => {
        if (!filteredAssets || filteredAssets.length === 0) {
            return [];
        }

        const categoryMap = new Map<string, Map<string, AssetTypeData>>();

        filteredAssets.forEach((asset) => {
            const category = asset.secondaryCategory || asset.primaryCategory || 'Other';
            const type = asset.type;

            if (!categoryMap.has(category)) {
                categoryMap.set(category, new Map());
            }

            const typeMap = categoryMap.get(category)!;

            if (typeMap.has(type)) {
                const existingType = typeMap.get(type)!;
                typeMap.set(type, {
                    ...existingType,
                    count: existingType.count + 1,
                });
            } else {
                const spec = assetSpecMap.get(type);
                typeMap.set(type, {
                    type,
                    count: 1,
                    styles: asset.styles || {
                        alt: asset.type.split('#').pop() || asset.type,
                    },
                    source: spec?.source,
                });
            }
        });

        const categoryData: CategoryData[] = Array.from(categoryMap.entries()).map(([category, typeMap]) => ({
            category,
            assetTypes: Array.from(typeMap.values()),
        }));

        const sortDirection = sortOption === 'a-z' ? 1 : -1;

        const sortedCategories = categoryData.toSorted((a, b) => sortDirection * a.category.localeCompare(b.category));

        const categoriesWithSortedTypes = sortedCategories.map((category) => {
            const sortedAssetTypes = category.assetTypes.toSorted((a, b) => {
                const nameA = formatAltText(a.styles.alt).toUpperCase();
                const nameB = formatAltText(b.styles.alt).toUpperCase();
                return sortDirection * nameA.localeCompare(nameB);
            });
            return {
                ...category,
                assetTypes: sortedAssetTypes,
            };
        });

        return categoriesWithSortedTypes;
    }, [filteredAssets, sortOption, assetSpecMap]);

    const filteredCategories = useMemo(() => {
        if (!searchQuery.trim()) {
            return categories;
        }

        const searchLower = searchQuery.toLowerCase();
        return categories
            .map((category) => {
                const filteredAssetTypes = category.assetTypes.filter(
                    (assetType) =>
                        formatAltText(assetType.styles.alt).toLowerCase().includes(searchLower) || category.category.toLowerCase().includes(searchLower),
                );
                return filteredAssetTypes.length > 0 ? { ...category, assetTypes: filteredAssetTypes } : null;
            })
            .filter((category): category is CategoryData => category !== null);
    }, [categories, searchQuery]);

    if (isErrorAssessments || !assessment) {
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
                    No assessment available
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
            {isLoadingAssets && (
                <Backdrop
                    open={isLoadingAssets}
                    sx={{
                        position: 'absolute',
                        zIndex: 10,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        inset: 0,
                    }}
                >
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', px: 2 }}>
                        <Typography variant="h6" sx={{ color: '#fff', alignSelf: 'center', mb: 2 }}>
                            Loading datasets {Math.round(progress * 100)}%
                        </Typography>
                        <LinearProgress variant="determinate" value={progress * 100} />
                    </Box>
                </Backdrop>
            )}

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
                {filteredCategories.length === 0 && !isLoadingAssets && (
                    <Box sx={{ p: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            No assets found
                        </Typography>
                    </Box>
                )}

                {filteredCategories.map((category) => {
                    const isExpanded = expandedCategories.has(category.category);
                    return (
                        <Box key={category.category} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Box
                                onClick={() => toggleCategory(category.category)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        toggleCategory(category.category);
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
                                    {category.category} ({category.assetTypes.length})
                                </Typography>
                                <IconButton size="small">{isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
                            </Box>

                            <Collapse in={isExpanded}>
                                <Box sx={{ pl: 2, pr: 1, pb: 1 }}>
                                    {category.assetTypes.map((assetType) => {
                                        const isSelected = selectedAssetTypes[assetType.type] || false;
                                        return (
                                            <ListItem
                                                key={assetType.type}
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    px: 0,
                                                    py: 0.5,
                                                }}
                                            >
                                                <AssetTypeListItemText assetType={assetType} />
                                                <ToggleSwitch
                                                    checked={isSelected}
                                                    onChange={() => toggleAssetType(assetType.type)}
                                                    inputProps={{ 'aria-label': `Toggle ${formatAltText(assetType.styles.alt)}` }}
                                                />
                                            </ListItem>
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
