import { useCallback, useMemo, useState, useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Alert, Box, Button, IconButton, Snackbar, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import type { Geometry } from 'geojson';
import { fetchScenarios, type Scenario } from '@/api/scenarios';
import { fetchDataroomAssets, type DataroomAsset } from '@/api/dataroom-assets';
import { useAssetTypeIcons } from '@/hooks/useAssetTypeIcons';
import DataroomMap from '@/components/DataroomMap';
import AssetLayers from '@/components/map-v2/AssetLayers';
import AssetFilterBar, { type AssetFilters } from '@/components/EditScenario/AssetFilterBar';
import AssetTable from '@/components/EditScenario/AssetTable';
import { getLocationFromGeometry } from '@/api/geometry-parser';
import type { Asset } from '@/api/assets-by-type';
import { useUserData } from '@/hooks/useUserData';

export default function EditScenario() {
    const { id: scenarioId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const iconMap = useAssetTypeIcons();
    const { isAdmin, loading: userLoading } = useUserData();

    const {
        data: scenarios,
        isLoading: scenariosLoading,
        isError: scenariosError,
        error: scenariosErrorObj,
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

    const assetParams = {
        scenarioId: scenario?.id ?? '',
        categoryId: filters.categoryId || undefined,
        subCategoryId: filters.subCategoryId || undefined,
        assetTypeId: filters.assetTypeId || undefined,
        geometry: filterGeometry || undefined,
    };

    const {
        data: assets,
        isLoading: assetsLoading,
        isError: assetsError,
        error: assetsErrorObj,
    } = useQuery<DataroomAsset[], Error>({
        queryKey: ['dataroom-assets', assetParams],
        queryFn: () => fetchDataroomAssets(assetParams),
        enabled: !!scenario,
    });

    useEffect(() => {
        if (scenariosError) {
            setErrorMessage(scenariosErrorObj?.message ?? 'Failed to fetch scenarios');
        }
    }, [scenariosError, scenariosErrorObj]);

    useEffect(() => {
        if (assetsError) {
            setErrorMessage(assetsErrorObj?.message ?? 'Failed to fetch assets');
        }
    }, [assetsError, assetsErrorObj]);

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

    const tableAssets = useMemo(() => {
        if (!assets) {
            return [];
        }
        if (!filters.search) {
            return assets;
        }
        const lower = filters.search.toLowerCase();
        return assets.filter(
            (a) =>
                a.id.toLowerCase().includes(lower) ||
                a.name.toLowerCase().includes(lower) ||
                a.assetTypeName.toLowerCase().includes(lower) ||
                a.subCategoryName.toLowerCase().includes(lower) ||
                a.categoryName.toLowerCase().includes(lower),
        );
    }, [assets, filters.search]);

    const mapAssets: Asset[] = useMemo(() => {
        if (!assets || !assetsVisible) {
            return [];
        }
        return assets.map((a) => {
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
    }, [assets, iconMap, assetsVisible]);

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

    const handleSave = () => {
        navigate(`/data-room/scenarios/${scenarioId}`);
    };

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
                    <IconButton onClick={() => navigate(`/data-room/scenarios/${scenarioId}`)} size="small">
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
                <Button variant="contained" onClick={handleSave}>
                    SAVE
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
                    <Button variant="contained" startIcon={<EditIcon />} sx={{ ml: 'auto', whiteSpace: 'nowrap' }}>
                        EDIT {selectedIds.size} SELECTED
                    </Button>
                )}
            </Box>

            <AssetTable assets={tableAssets} selectedIds={selectedIds} onSelectionChange={setSelectedIds} isLoading={assetsLoading} />

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
