import { useCallback, useMemo, useState, useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Snackbar, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import type { Geometry } from 'geojson';
import { fetchScenarios, type Scenario } from '@/api/scenarios';
import { fetchDataroomAssets, updateBulkCriticality, type DataroomAsset } from '@/api/dataroom-assets';
import { useAssetTypeIcons } from '@/hooks/useAssetTypeIcons';
import DataroomMap from '@/components/DataroomMap';
import AssetLayers from '@/components/map-v2/AssetLayers';
import AssetFilterBar, { type AssetFilters } from '@/components/EditScenario/AssetFilterBar';
import AssetTable from '@/components/EditScenario/AssetTable';
import EditCriticalityDialog from '@/components/EditScenario/EditCriticalityDialog';
import { getLocationFromGeometry } from '@/api/geometry-parser';
import type { Asset } from '@/api/assets-by-type';
import { useUserData } from '@/hooks/useUserData';
import { pluralize } from '@/utils';

export default function EditScenario() {
    const { id: scenarioId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const iconMap = useAssetTypeIcons();
    const { isAdmin, loading: userLoading } = useUserData();

    const {
        data: scenarios,
        isLoading: scenariosLoading,
        isError: isScenariosError,
        error: scenariosError,
    } = useQuery<Scenario[], Error>({
        queryKey: ['scenarios'],
        queryFn: fetchScenarios,
        staleTime: 5 * 60 * 1000,
    });
    const scenario = scenarios?.find((s) => s.id === scenarioId);

    const [filters, setFilters] = useState<AssetFilters>({
        search: '',
        categoryId: '',
        subCategoryId: '',
        assetTypeId: '',
    });
    const [filterGeometry, setFilterGeometry] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [assetsVisible, setAssetsVisible] = useState(true);
    const [isDrawing, setIsDrawing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [pendingEdits, setPendingEdits] = useState<Map<string, number>>(new Map());
    const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const hasPendingEdits = pendingEdits.size > 0;
    const pendingEditIds = useMemo(() => new Set(pendingEdits.keys()), [pendingEdits]);
    const queryClient = useQueryClient();

    const assetParams = {
        scenarioId: scenario?.id ?? '',
        categoryId: filters.categoryId || undefined,
        subCategoryId: filters.subCategoryId || undefined,
        assetTypeId: filters.assetTypeId || undefined,
        geometry: filterGeometry || undefined,
    };

    const {
        data: assets,
        isFetching: assetsFetching,
        isError: isAssetsError,
        error: assetsError,
    } = useQuery<DataroomAsset[], Error>({
        queryKey: ['dataroom-assets', assetParams],
        queryFn: () => fetchDataroomAssets(assetParams),
        enabled: !!scenario,
    });

    useEffect(() => {
        if (isScenariosError) {
            setErrorMessage(scenariosError?.message ?? 'Failed to fetch scenarios');
        }
    }, [isScenariosError, scenariosError]);

    useEffect(() => {
        if (isAssetsError) {
            setErrorMessage(assetsError?.message ?? 'Failed to fetch assets');
        }
    }, [isAssetsError, assetsError]);

    useEffect(() => {
        if (!assets) {
            return;
        }
        const currentAssetIds = new Set(assets.map((a) => a.id));
        setSelectedIds((prev) => {
            const pruned = new Set([...prev].filter((id) => currentAssetIds.has(id)));
            if (pruned.size === prev.size) {
                return prev;
            }
            return pruned;
        });
    }, [assets]);

    const originalScores = useMemo(() => {
        const map = new Map<string, number>();
        if (assets) {
            for (const a of assets) {
                map.set(a.id, a.criticalityScore);
            }
        }
        return map;
    }, [assets]);

    const applyPendingEdits = useCallback(
        (list: DataroomAsset[]): DataroomAsset[] => {
            if (pendingEdits.size === 0) {
                return list;
            }
            return list.map((a) => {
                const pendingScore = pendingEdits.get(a.id);
                return pendingScore === undefined ? a : { ...a, criticalityScore: pendingScore };
            });
        },
        [pendingEdits],
    );

    const tableAssets = useMemo(() => {
        if (!assets) {
            return [];
        }
        let filtered = assets;
        if (filters.search) {
            const lower = filters.search.toLowerCase();
            filtered = assets.filter(
                (a) =>
                    a.id.toLowerCase().includes(lower) ||
                    a.name.toLowerCase().includes(lower) ||
                    a.assetTypeName.toLowerCase().includes(lower) ||
                    a.subCategoryName.toLowerCase().includes(lower) ||
                    a.categoryName.toLowerCase().includes(lower),
            );
        }
        return applyPendingEdits(filtered);
    }, [assets, filters.search, applyPendingEdits]);

    const mapAssets: Asset[] = useMemo(() => {
        if (!assets || !assetsVisible) {
            return [];
        }
        return applyPendingEdits(assets).map((a) => {
            const location = getLocationFromGeometry(a.geometry);
            const icon = iconMap.get(a.assetTypeId);
            const iconName = icon?.replace('fa-', '');
            return {
                id: a.id,
                type: a.assetTypeId,
                name: a.name,
                lat: location?.lat,
                lng: location?.lng,
                geometry: a.geometry,
                dependent: { count: 0, criticalitySum: a.criticalityScore },
                styles: {
                    classUri: a.assetTypeId,
                    color: '#DDDDDD',
                    backgroundColor: '#121212',
                    faIcon: icon,
                    iconFallbackText: iconName || a.assetTypeName?.substring(0, 2) || '?',
                    alt: a.assetTypeName,
                },
                elementType: 'asset' as const,
            };
        });
    }, [assets, iconMap, assetsVisible, applyPendingEdits]);

    const selectedAssets: Asset[] = useMemo(() => {
        return mapAssets.filter((a) => selectedIds.has(a.id));
    }, [mapAssets, selectedIds]);

    const handleFeatureClick = useCallback((elements: Asset[]) => {
        if (elements.length === 0) {
            return;
        }
        const id = elements[0].id;
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const handleDrawComplete = useCallback((geometry: Geometry) => {
        setFilterGeometry(JSON.stringify(geometry));
    }, []);

    const handleClearDrawnArea = useCallback(() => {
        setFilterGeometry(null);
    }, []);

    const handleBulkConfirm = useCallback(
        (score: number) => {
            setPendingEdits((prev) => {
                const next = new Map(prev);
                for (const id of selectedIds) {
                    if (originalScores.get(id) === score) {
                        next.delete(id);
                    } else {
                        next.set(id, score);
                    }
                }
                return next;
            });
            setSelectedIds(new Set());
            setEditDialogOpen(false);
        },
        [selectedIds, originalScores],
    );

    const handleInlineEdit = useCallback(
        (assetId: string, score: number) => {
            setPendingEdits((prev) => {
                const next = new Map(prev);
                if (originalScores.get(assetId) === score) {
                    next.delete(assetId);
                } else {
                    next.set(assetId, score);
                }
                return next;
            });
        },
        [originalScores],
    );

    const handleBack = useCallback(() => {
        if (hasPendingEdits) {
            setDiscardDialogOpen(true);
        } else {
            navigate(`/data-room/scenarios/${scenarioId}`);
        }
    }, [hasPendingEdits, navigate, scenarioId]);

    const handleSave = useCallback(async () => {
        if (!scenario || pendingEdits.size === 0) {
            return;
        }
        setSaveDialogOpen(false);
        const updates = Array.from(pendingEdits.entries()).map(([assetId, criticalityScore]) => ({
            assetId,
            criticalityScore,
        }));
        setIsSaving(true);
        try {
            await updateBulkCriticality(scenario.id, { updates });
            queryClient.invalidateQueries({ queryKey: ['dataroom-assets'] });
            queryClient.invalidateQueries({ queryKey: ['asset-score', scenario.id] });
            queryClient.invalidateQueries({ queryKey: ['scenarioAssets', scenario.id] });
            setPendingEdits(new Map());
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : 'Failed to save criticality scores');
        } finally {
            setIsSaving(false);
        }
    }, [scenario, pendingEdits, queryClient]);

    if (userLoading || scenariosLoading) {
        return <Typography>Loading...</Typography>;
    }

    if (!isAdmin) {
        return <Navigate to="/data-room" replace />;
    }

    if (!scenario) {
        return <Typography color="error">Scenario not found.</Typography>;
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton onClick={handleBack} size="small">
                        <ArrowBackIcon />
                    </IconButton>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {scenario.code || scenario.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {scenario.name}
                        </Typography>
                    </Box>
                </Box>
                <Button variant="contained" onClick={() => setSaveDialogOpen(true)} disabled={!hasPendingEdits || isSaving}>
                    {isSaving ? 'SAVING...' : 'SAVE'}
                </Button>
            </Box>

            <Box sx={{ height: 350, border: 1, borderColor: 'divider', overflow: 'hidden' }}>
                <DataroomMap
                    height="100%"
                    drawingEnabled
                    onDrawComplete={handleDrawComplete}
                    onDrawingChange={setIsDrawing}
                    onClearDrawnArea={handleClearDrawnArea}
                    visibilityToggle={{
                        visible: assetsVisible,
                        onToggle: () => setAssetsVisible((prev) => !prev),
                        tooltip: assetsVisible ? 'Hide assets' : 'Show assets',
                    }}
                    isLoading={assetsFetching}
                >
                    <AssetLayers
                        assets={mapAssets}
                        selectedElements={selectedAssets}
                        onElementClick={handleFeatureClick}
                        interactionDisabled={isDrawing}
                        mapReady
                    />
                </DataroomMap>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AssetFilterBar filters={filters} onFiltersChange={setFilters} />
                {selectedIds.size > 0 && (
                    <Button variant="contained" startIcon={<EditIcon />} sx={{ ml: 'auto', whiteSpace: 'nowrap' }} onClick={() => setEditDialogOpen(true)}>
                        {selectedIds.size === tableAssets.length ? 'EDIT ALL' : `EDIT ${selectedIds.size} SELECTED`}
                    </Button>
                )}
            </Box>

            <AssetTable
                assets={tableAssets}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                onCriticalityEdit={handleInlineEdit}
                isFetching={assetsFetching}
                pendingEditIds={pendingEditIds}
            />

            <EditCriticalityDialog open={editDialogOpen} count={selectedIds.size} onClose={() => setEditDialogOpen(false)} onConfirm={handleBulkConfirm} />

            <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>{`Save ${pendingEdits.size} ${pluralize('item', pendingEdits.size)}`}</DialogTitle>
                <DialogContent>
                    <Typography variant="body1">
                        {`You are saving criticality score changes for ${pendingEdits.size} ${pluralize('item', pendingEdits.size)}.`}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setSaveDialogOpen(false)} variant="outlined">
                        CANCEL
                    </Button>
                    <Button onClick={handleSave} variant="contained">
                        SAVE
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={discardDialogOpen} onClose={() => setDiscardDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Discard changes?</DialogTitle>
                <DialogContent>
                    <Typography>You have unsaved changes. Going back will discard all pending edits.</Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDiscardDialogOpen(false)} variant="outlined">
                        CANCEL
                    </Button>
                    <Button onClick={() => navigate(`/data-room/scenarios/${scenarioId}`)} variant="contained" color="error">
                        DISCARD
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={!!errorMessage}
                autoHideDuration={5000}
                onClose={() => setErrorMessage(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity="error" onClose={() => setErrorMessage(null)}>
                    {errorMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}
