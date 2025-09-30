import { useSuspenseQuery } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';
import ListItem from '@mui/material/ListItem';
import Box from '@mui/material/Box';
import ListItemText from '@mui/material/ListItemText';
import { Backdrop, Grid2, LinearProgress, Typography } from '@mui/material';
import { capitalize } from '@/utils/capitalize';

import type { Asset } from '@/models';
import type { FoundIcon } from '@/hooks/useFindIcon';

import { fetchAssessments } from '@/api/assessments';
import { useGroupedAssets } from '@/hooks';
import useSharedStore from '@/hooks/useSharedStore';

import ComplexLayerControl from '@/components/ComplexLayerControl';
import type { LayerControlProps } from '@/tools/Tool';
import MaterialUISwitch from '@/components/Switch';

function formatAltText(altText: string) {
    return altText.replace(/([A-Z])/g, ' $1').trim();
}

export default function AssetLayerControl({ searchQuery }: Readonly<LayerControlProps>) {
    const { isError: isErrorAssessments, data: assessmentsData } = useSuspenseQuery({
        queryKey: ['assessments'],
        queryFn: fetchAssessments,
    });

    if (isErrorAssessments) {
        return null;
    }

    return (
        <>
            {assessmentsData.map((assessment) => (
                <AssessmentAssetLayerControls key={assessment.uri} assessment={assessment.uri} searchQuery={searchQuery} />
            ))}
        </>
    );
}

interface AssessmentAssetLayerControlsProps {
    readonly assessment: string;
    readonly searchQuery: string;
}

function AssessmentAssetLayerControls({ assessment, searchQuery }: AssessmentAssetLayerControlsProps) {
    const { isLoadingAssets, filteredAssets, progress } = useGroupedAssets({
        assessment,
        searchFilter: searchQuery,
    });

    const sortedCategories = useMemo(() => {
        const categoriesWithCriticality = (filteredAssets || []).reduce(
            (acc, asset) => {
                const { secondaryCategory } = asset;
                if (!acc[secondaryCategory]) {
                    acc[secondaryCategory] = {
                        category: secondaryCategory,
                        totalCriticality: 0,
                        assets: [],
                    };
                }
                acc[secondaryCategory].totalCriticality += asset.dependent.criticalitySum;
                acc[secondaryCategory].assets.push(asset);
                return acc;
            },
            {} as {
                [category: string]: {
                    category: string;
                    totalCriticality: number;
                    assets: Asset[];
                };
            },
        );

        return Object.values(categoriesWithCriticality).sort((a, b) => b.totalCriticality - a.totalCriticality);
    }, [filteredAssets]);

    return (
        <Grid2 size={12} container>
            {isLoadingAssets && (
                <Backdrop
                    open={isLoadingAssets}
                    sx={{
                        position: 'absolute',
                        paddingX: 2,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: '100%',
                            paddingX: 1,
                        }}
                    >
                        <Typography variant="h6" sx={{ color: '#fff', alignSelf: 'center' }}>
                            Loading datasets {Math.round(progress * 100)}%
                        </Typography>
                        <LinearProgress variant="determinate" value={progress * 100} />
                    </Box>
                </Backdrop>
            )}
            {sortedCategories.map((category) => (
                <Grid2 size={12} key={category.category}>
                    <AssessmentCategoryLayerControls key={category.category} category={category.category} assets={category.assets} />
                </Grid2>
            ))}
        </Grid2>
    );
}

interface AssessmentCategoryLayerControlsProps {
    readonly category: string;
    readonly assets: Asset[];
}

function AssessmentCategoryLayerControls({ category, assets }: Readonly<AssessmentCategoryLayerControlsProps>) {
    const selectedAssetTypes = useSharedStore((state) => state.selectedAssetTypes);
    const selectAssetType = useSharedStore((state) => state.selectAssetType);
    const deselectAssetType = useSharedStore((state) => state.deselectAssetType);

    const assetsBySecondaryCategory = useMemo(() => {
        const categoryMap = {} as {
            [category: string]: {
                [type: string]: {
                    count: number;
                    maxCriticality: number;
                    type: string;
                    styles: FoundIcon;
                };
            };
        };
        assets.forEach((asset) => {
            const category = asset.secondaryCategory;
            if (!categoryMap[category]) {
                categoryMap[category] = {};
            }
            const type = asset.type;
            if (!categoryMap[category][type]) {
                categoryMap[category][type] = {
                    ...asset,
                    count: 1,
                    maxCriticality: asset.dependent.criticalitySum,
                };
            } else {
                categoryMap[category][type].count += 1;
                if (asset.dependent.criticalitySum > categoryMap[category][type].maxCriticality) {
                    categoryMap[category][type].maxCriticality = asset.dependent.criticalitySum;
                }
            }
        });
        return categoryMap;
    }, [assets]);

    const handleTypeClick = useCallback(
        (typeURI: string) => {
            if (selectedAssetTypes[typeURI]) {
                deselectAssetType(typeURI);
            } else {
                selectAssetType(typeURI);
            }
        },
        [selectedAssetTypes, deselectAssetType, selectAssetType],
    );

    return (
        <ComplexLayerControl title={category}>
            {(updateSelectedCount) =>
                Object.entries(assetsBySecondaryCategory).map(([category, types]) => (
                    <SecondaryCategoryControls key={category} types={types} onClickType={handleTypeClick} updateSelectedCount={updateSelectedCount} />
                ))
            }
        </ComplexLayerControl>
    );
}

interface SecondaryCategoryControlsProps {
    readonly types: {
        [category: string]: {
            count: number;
            maxCriticality: number;
            type: string;
            styles: FoundIcon;
        };
    };

    readonly onClickType: (typeURI: string) => void;
    readonly updateSelectedCount: (isSelected: boolean) => void;
}

function SecondaryCategoryControls({ types, onClickType, updateSelectedCount }: SecondaryCategoryControlsProps) {
    const selectedAssetTypes = useSharedStore((state) => state.selectedAssetTypes);

    return (
        <div>
            <ul className="flex flex-col">
                {Object.values(types)
                    .sort((a, b) => {
                        const criticalityDifference = b.maxCriticality - a.maxCriticality;
                        if (criticalityDifference !== 0) {
                            return criticalityDifference;
                        }
                        const nameA = formatAltText(a.styles.alt).toUpperCase();
                        const nameB = formatAltText(b.styles.alt).toUpperCase();
                        return nameA.localeCompare(nameB);
                    })
                    .map((asset) => (
                        <AssetTypeControls
                            key={asset.type}
                            asset={asset}
                            isSelected={selectedAssetTypes[asset.type]}
                            onClickType={(typeURI) => {
                                onClickType(typeURI);
                                updateSelectedCount(!selectedAssetTypes[typeURI]);
                            }}
                        />
                    ))}
            </ul>
        </div>
    );
}

interface AssetTypeControlsProps {
    readonly asset: {
        count: number;
        maxCriticality: number;
        type: string;
        styles: FoundIcon;
    };

    readonly isSelected: boolean;
    readonly onClickType: (assetType: string) => void;
}

function AssetTypeControls({ asset, onClickType, isSelected = false }: AssetTypeControlsProps) {
    const handleToggle = useCallback(() => {
        onClickType(asset.type); // Notify parent about the toggle
    }, [onClickType, asset]);

    return (
        <ListItem
            key={asset.type}
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #e0e0e0',
                padding: 0,
            }}
        >
            <Box>
                <ListItemText
                    primary={capitalize(formatAltText(asset.styles.alt))}
                    secondary={`Count: ${asset.count}`}
                    sx={{ marginTop: '3px', marginBottom: '3px' }}
                />
            </Box>
            <MaterialUISwitch
                checked={isSelected} // Ensure the switch is always controlled
                onChange={handleToggle} // Handle toggle only in onChange
                inputProps={{ 'aria-label': 'controlled' }}
            />
        </ListItem>
    );
}
