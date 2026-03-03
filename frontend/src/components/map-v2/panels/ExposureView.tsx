import { CheckCircleOutlineOutlined, DeleteOutline, EditNoteOutlined } from '@mui/icons-material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CloseIcon from '@mui/icons-material/Close';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
    Box,
    IconButton,
    Typography,
    ListItem,
    Collapse,
    Button,
    Alert,
    AlertTitle,
    Portal,
    Snackbar,
    Menu,
    MenuItem,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
} from '@mui/material';
import { useIsFetching, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Feature } from 'geojson';
import React, { useCallback, useMemo, useState, useEffect, useLayoutEffect, useRef, type ChangeEvent, type KeyboardEvent, type MouseEvent } from 'react';
import { FEATURE_TYPES } from '../constants';
import { useDrawingContext } from '../context/DrawingContext';
import useExposureLayerMutations from '../hooks/useExposureLayerMutations';
import FocusAreaSelector from './FocusAreaSelector';
import {
    toggleExposureLayerVisibility,
    bulkToggleExposureLayerVisibility,
    updateExposureLayer,
    deleteExposureLayer,
    publishExposureLayer,
    type ExposureLayerGroup,
    type ExposureLayer,
    type ExposureLayersResponse,
    type FocusAreaRelation,
} from '@/api/exposure-layers';
import IconToggle, { type VisibilityState } from '@/components/IconToggle';

const FLOODS_EXPOSURE_LAYER_TYPE_ID = '2d373dca-1337-4e60-ba08-c8326d27042d';

const BADGE_CONFIG: Record<FocusAreaRelation, { label: string; bgColor: string; textColor: string }> = {
    contained: { label: 'In area', bgColor: '#7eb66d', textColor: '#000' },
    overlaps: { label: 'Partially in area', bgColor: '#dfc96e', textColor: '#000' },
    elsewhere: { label: 'Not in area', bgColor: '#929292', textColor: '#fff' },
};

type SpatialRelationBadgeProps = {
    relation?: FocusAreaRelation;
};

const SpatialRelationBadge = React.memo(({ relation }: SpatialRelationBadgeProps) => {
    if (!relation) {
        return null;
    }

    const config = BADGE_CONFIG[relation];

    return (
        <Box
            component="span"
            sx={{
                px: 1,
                py: 0.25,
                borderRadius: 1,
                backgroundColor: config.bgColor,
                color: config.textColor,
                fontSize: '0.7rem',
                whiteSpace: 'nowrap',
            }}
        >
            {config.label}
        </Box>
    );
});

SpatialRelationBadge.displayName = 'SpatialRelationBadge';

const getGroupNamesWithActiveLayers = (groups: ExposureLayerGroup[]): Set<string> => {
    const names = new Set<string>();
    for (const group of groups) {
        if (group.exposureLayers.some((layer) => layer.isActive)) {
            names.add(group.name);
        }
    }
    return names;
};

const buildLayerVisibilityMap = (groups: ExposureLayerGroup[]): Record<string, boolean> => {
    const ids: Record<string, boolean> = {};
    for (const group of groups) {
        for (const layer of group.exposureLayers) {
            ids[layer.id] = layer.isActive ?? false;
        }
    }
    return ids;
};

const getLayerId = (layer: Feature): string | null => {
    const featureId = layer.id || layer.properties?.id;
    return featureId !== null && featureId !== undefined ? String(featureId) : null;
};

type ExposureViewProps = {
    onClose: () => void;
    scenarioId?: string;
    selectedFocusAreaId?: string | null;
    onFocusAreaSelect?: (focusAreaId: string | null) => void;
    exposureLayersData?: ExposureLayersResponse;
    isLoading?: boolean;
    isError?: boolean;
};

type ExposureLayerListItemTextProps = {
    layer: Feature;
};

const ExposureLayerListItemText = React.memo(({ layer }: ExposureLayerListItemTextProps) => {
    const name = (layer.properties?.name as string) || 'Unnamed Layer';

    return (
        <Typography
            variant="body2"
            sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                minWidth: 0,
            }}
        >
            {name}
        </Typography>
    );
});

ExposureLayerListItemText.displayName = 'ExposureLayerListItemText';

type ExposureLayerListProps = {
    layers: Feature[];
    selectedExposureLayerIds: Record<string, boolean>;
    onToggle: (layerId: string) => void;
    disabled?: boolean;
};

const ExposureLayerList = React.memo(({ layers, selectedExposureLayerIds, onToggle, disabled }: ExposureLayerListProps) => {
    return (
        <Box sx={{ pl: 2, pr: 1, pb: 1 }}>
            {layers.map((layer) => {
                const layerId = getLayerId(layer);
                if (!layerId) {
                    return null;
                }
                const isSelected = selectedExposureLayerIds[layerId] || false;
                const name = (layer.properties?.name as string) || 'Unnamed Layer';
                const focusAreaRelation = layer.properties?.focusAreaRelation as FocusAreaRelation | undefined;
                return (
                    <ListItem
                        key={layerId}
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            px: 1,
                            py: 0.5,
                        }}
                    >
                        <ExposureLayerListItemText layer={layer} />
                        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                            <SpatialRelationBadge relation={focusAreaRelation} />
                            <IconToggle
                                checked={isSelected}
                                onChange={() => onToggle(layerId)}
                                disabled={disabled}
                                aria-label={isSelected ? `Hide ${name}` : `Show ${name}`}
                                size="small"
                            />
                        </Box>
                    </ListItem>
                );
            })}
        </Box>
    );
});

ExposureLayerList.displayName = 'ExposureLayerList';

type UserDrawnLayerItemProps = {
    layer: ExposureLayer;
    isVisible: boolean;
    onToggle: (layerId: string) => void;
    onUpdate: (layerId: string, name: string) => void;
    onDelete: (layerId: string) => void;
    onPublish: (layerId: string) => void;
    disabled?: boolean;
};

const UserDrawnLayerItem = React.memo(({ layer, isVisible, onToggle, onUpdate, onDelete, onPublish, disabled }: UserDrawnLayerItemProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(layer.name);
    const [nameError, setNameError] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [publishDialogOpen, setPublishDialogOpen] = useState(false);

    const isUnpublished = !layer.status || layer.status === 'unpublished';
    const isPending = layer.status === 'pending';

    const handleEditClick = (e: MouseEvent) => {
        e.stopPropagation();
        setEditName(layer.name);
        setNameError(null);
        setIsEditing(true);
    };

    const handleNameBlur = () => {
        const trimmedName = editName.trim();
        if (!trimmedName) {
            setNameError('Name cannot be empty');
            return;
        }
        setNameError(null);
        setIsEditing(false);
        if (trimmedName !== layer.name) {
            onUpdate(layer.id, trimmedName);
        }
    };

    const handleNameKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleNameBlur();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setEditName(layer.name);
            setNameError(null);
        }
    };

    const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        setEditName(e.target.value);
        if (nameError) {
            setNameError(null);
        }
    };

    const handleDeleteClick = (e: MouseEvent) => {
        e.stopPropagation();
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = (e: MouseEvent) => {
        e.stopPropagation();
        setDeleteDialogOpen(false);
        onDelete(layer.id);
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
    };

    const handlePublishClick = (e: MouseEvent) => {
        e.stopPropagation();
        setPublishDialogOpen(true);
    };

    const handlePublishConfirm = (e: MouseEvent) => {
        e.stopPropagation();
        setPublishDialogOpen(false);
        onPublish(layer.id);
    };

    const handlePublishCancel = () => {
        setPublishDialogOpen(false);
    };

    return (
        <Box
            onDoubleClick={isUnpublished ? handleEditClick : undefined}
            sx={{
                'display': 'flex',
                'alignItems': 'flex-start',
                'justifyContent': 'space-between',
                'py': 0.5,
                'px': 1,
                '&:hover': {
                    backgroundColor: 'action.hover',
                },
            }}
        >
            <Box sx={{ flex: 1, minWidth: 0 }}>
                {isEditing ? (
                    <TextField
                        value={editName}
                        onChange={handleNameChange}
                        onBlur={handleNameBlur}
                        onKeyDown={handleNameKeyDown}
                        size="small"
                        autoFocus
                        fullWidth
                        error={!!nameError}
                        helperText={nameError}
                        sx={{
                            '& .MuiInputBase-input': {
                                py: 0.5,
                                fontSize: '0.875rem',
                            },
                        }}
                    />
                ) : (
                    <Typography
                        variant="body2"
                        sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {layer.publishedId ? `${layer.publishedId} ${layer.name}` : layer.name}
                    </Typography>
                )}
                <SpatialRelationBadge relation={layer.focusAreaRelation} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }} onDoubleClick={(e) => e.stopPropagation()}>
                {isUnpublished && (
                    <>
                        <IconButton size="small" onClick={handlePublishClick} disabled={disabled} aria-label="Send to Data Room" title="Send to Data Room">
                            <img src="/icons/map-v2/dataroom-send.svg" alt="Send to Data Room" width={18} height={18} />
                        </IconButton>
                        <IconButton size="small" onClick={handleEditClick} disabled={disabled} aria-label="Edit layer name" title="Edit name">
                            <EditNoteOutlined fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={handleDeleteClick} disabled={disabled} aria-label="Delete layer" title="Delete">
                            <DeleteOutline fontSize="small" />
                        </IconButton>
                    </>
                )}
                {isPending && <CheckCircleOutlineOutlined fontSize="small" sx={{ color: 'action.active', ml: 0.5, mr: 0.5 }} titleAccess="Sent to Data Room" />}
                <IconToggle
                    checked={isVisible}
                    onChange={() => onToggle(layer.id)}
                    disabled={disabled}
                    aria-label={isVisible ? 'Hide layer' : 'Show layer'}
                    size="small"
                />
            </Box>

            <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel} maxWidth="xs" fullWidth>
                <DialogTitle>Delete exposure layer</DialogTitle>
                <DialogContent>
                    <Typography variant="body1">Are you sure you want to delete "{layer.name || 'Unnamed layer'}"?</Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleDeleteCancel} variant="outlined">
                        CANCEL
                    </Button>
                    <Button onClick={handleDeleteConfirm} variant="contained" color="error">
                        DELETE
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={publishDialogOpen} onClose={handlePublishCancel} maxWidth="xs" fullWidth>
                <DialogTitle>Send exposure layer to Data Room</DialogTitle>
                <DialogContent>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Sending this exposure layer to the Data Room will submit it for admin review.
                    </Typography>
                    <Typography variant="body1">If approved, "{layer.name || 'Unnamed layer'}" will be available to all users in this scenario.</Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handlePublishCancel} variant="outlined">
                        CANCEL
                    </Button>
                    <Button
                        onClick={handlePublishConfirm}
                        variant="contained"
                        startIcon={<img src="/icons/map-v2/dataroom-send.svg" alt="" width={18} height={18} style={{ filter: 'brightness(0) invert(1)' }} />}
                    >
                        SEND
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
});

UserDrawnLayerItem.displayName = 'UserDrawnLayerItem';

type ExposureGroupProps = {
    groupId: string;
    groupName: string;
    layers: Feature[];
    isExpanded: boolean;
    selectedExposureLayerIds: Record<string, boolean>;
    onToggleGroup: (groupName: string) => void;
    onToggleLayer: (layerId: string) => void;
    onBulkToggle?: (groupId: string, isActive: boolean) => void;
    disabled?: boolean;
    showBulkToggle?: boolean;
};

const ExposureGroup = React.memo(
    ({
        groupId,
        groupName,
        layers,
        isExpanded,
        selectedExposureLayerIds,
        onToggleGroup,
        onToggleLayer,
        onBulkToggle,
        disabled,
        showBulkToggle,
    }: ExposureGroupProps) => {
        const handleToggle = useCallback(
            (e: React.MouseEvent | React.KeyboardEvent) => {
                e.stopPropagation();
                e.preventDefault();
                onToggleGroup(groupName);
            },
            [groupName, onToggleGroup],
        );

        const layerIds = useMemo(() => layers.map(getLayerId).filter((id): id is string => id !== null), [layers]);

        const visibilityState: VisibilityState = useMemo(() => {
            if (layerIds.length === 0) {
                return 'hidden';
            }
            const activeCount = layerIds.filter((id) => selectedExposureLayerIds[id] === true).length;
            if (activeCount === 0) {
                return 'hidden';
            }
            if (activeCount === layerIds.length) {
                return 'visible';
            }
            return 'partial';
        }, [layerIds, selectedExposureLayerIds]);

        const handleToggleAll = useCallback(
            (e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                e.preventDefault();
                onBulkToggle?.(groupId, visibilityState !== 'visible');
            },
            [groupId, visibilityState, onBulkToggle],
        );

        return (
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <Button
                        onClick={handleToggle}
                        sx={{
                            'display': 'flex',
                            'alignItems': 'center',
                            'justifyContent': 'flex-start',
                            'flex': 1,
                            'p': 1.5,
                            'textTransform': 'none',
                            'color': 'text.primary',
                            '&:hover': {
                                backgroundColor: 'action.hover',
                            },
                        }}
                        aria-expanded={isExpanded}
                    >
                        <Box
                            component="span"
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mr: 1,
                                width: 24,
                                height: 24,
                            }}
                            aria-label={isExpanded ? 'Collapse' : 'Expand'}
                        >
                            {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                        </Box>
                        <Typography variant="body1" sx={{ flexGrow: 1, fontWeight: 500, textAlign: 'left' }}>
                            {groupName}
                        </Typography>
                    </Button>
                    {showBulkToggle && onBulkToggle && layerIds.length > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', px: 2, flexShrink: 0 }}>
                            <IconToggle
                                state={visibilityState}
                                onChange={handleToggleAll}
                                disabled={disabled}
                                aria-label={visibilityState === 'visible' ? 'Hide all' : 'Show all'}
                                size="small"
                            />
                        </Box>
                    )}
                </Box>

                <Collapse in={isExpanded}>
                    <ExposureLayerList layers={layers} selectedExposureLayerIds={selectedExposureLayerIds} onToggle={onToggleLayer} disabled={disabled} />
                </Collapse>
            </Box>
        );
    },
);

ExposureGroup.displayName = 'ExposureGroup';

type UserDrawnGroupProps = {
    groupId: string;
    groupName: string;
    layers: ExposureLayer[];
    isExpanded: boolean;
    selectedExposureLayerIds: Record<string, boolean>;
    onToggleGroup: (groupName: string) => void;
    onToggleLayer: (layerId: string) => void;
    onBulkToggle?: (groupId: string, isActive: boolean) => void;
    onUpdateLayer: (layerId: string, name: string) => void;
    onDeleteLayer: (layerId: string) => void;
    onPublishLayer: (layerId: string) => void;
    onStartDrawing?: (mode: 'circle' | 'polygon') => void;
    disabled?: boolean;
    isDrawing?: boolean;
};

const UserDrawnGroup = React.memo(
    ({
        groupId,
        groupName,
        layers,
        isExpanded,
        selectedExposureLayerIds,
        onToggleGroup,
        onToggleLayer,
        onBulkToggle,
        onUpdateLayer,
        onDeleteLayer,
        onPublishLayer,
        onStartDrawing,
        disabled,
        isDrawing,
    }: UserDrawnGroupProps) => {
        const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
        const menuOpen = Boolean(menuAnchorEl);

        const handleToggle = useCallback(
            (e: React.MouseEvent | React.KeyboardEvent) => {
                e.stopPropagation();
                e.preventDefault();
                onToggleGroup(groupName);
            },
            [onToggleGroup, groupName],
        );

        const visibilityState: VisibilityState = useMemo(() => {
            if (layers.length === 0) {
                return 'hidden';
            }
            const activeCount = layers.filter((layer) => selectedExposureLayerIds[layer.id] === true).length;
            if (activeCount === 0) {
                return 'hidden';
            }
            if (activeCount === layers.length) {
                return 'visible';
            }
            return 'partial';
        }, [layers, selectedExposureLayerIds]);

        const handleToggleAll = useCallback(
            (e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                e.preventDefault();
                onBulkToggle?.(groupId, visibilityState !== 'visible');
            },
            [groupId, visibilityState, onBulkToggle],
        );

        const handleDrawMenuClick = (event: MouseEvent<HTMLButtonElement>) => {
            setMenuAnchorEl(event.currentTarget);
        };

        const handleDrawCircle = useCallback(() => {
            setMenuAnchorEl(null);
            onStartDrawing?.('circle');
        }, [onStartDrawing]);

        const handleDrawPolygon = useCallback(() => {
            setMenuAnchorEl(null);
            onStartDrawing?.('polygon');
        }, [onStartDrawing]);

        return (
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <Button
                        onClick={handleToggle}
                        sx={{
                            'display': 'flex',
                            'alignItems': 'center',
                            'justifyContent': 'flex-start',
                            'flex': 1,
                            'p': 1.5,
                            'textTransform': 'none',
                            'color': 'text.primary',
                            '&:hover': {
                                backgroundColor: 'action.hover',
                            },
                        }}
                        aria-expanded={isExpanded}
                    >
                        <Box
                            component="span"
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mr: 1,
                                width: 24,
                                height: 24,
                            }}
                            aria-label={isExpanded ? 'Collapse' : 'Expand'}
                        >
                            {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                        </Box>
                        <Typography variant="body1" sx={{ flexGrow: 1, fontWeight: 500, textAlign: 'left' }}>
                            {groupName}
                        </Typography>
                    </Button>
                    {layers.length > 0 && onBulkToggle && (
                        <Box sx={{ display: 'flex', alignItems: 'center', px: 2, flexShrink: 0 }}>
                            <IconToggle
                                state={visibilityState}
                                onChange={handleToggleAll}
                                disabled={disabled}
                                aria-label={visibilityState === 'visible' ? 'Hide all' : 'Show all'}
                                size="small"
                            />
                        </Box>
                    )}
                </Box>

                <Collapse in={isExpanded}>
                    <Box sx={{ pl: 2, pr: 1, pb: 1 }}>
                        {layers.map((layer) => (
                            <UserDrawnLayerItem
                                key={layer.id}
                                layer={layer}
                                isVisible={selectedExposureLayerIds[layer.id] ?? false}
                                onToggle={onToggleLayer}
                                onUpdate={onUpdateLayer}
                                onDelete={onDeleteLayer}
                                onPublish={onPublishLayer}
                                disabled={disabled}
                            />
                        ))}
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <Button
                                variant="contained"
                                startIcon={<AddCircleIcon />}
                                onClick={handleDrawMenuClick}
                                disabled={isDrawing}
                                sx={{
                                    textTransform: 'uppercase',
                                    fontWeight: 500,
                                }}
                            >
                                Draw new exposure
                            </Button>
                        </Box>
                    </Box>
                </Collapse>

                <Menu
                    anchorEl={menuAnchorEl}
                    open={menuOpen}
                    onClose={() => setMenuAnchorEl(null)}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                    sx={{
                        'marginLeft': '1rem',
                        '& .MuiMenuItem-root': {
                            padding: '1rem',
                        },
                    }}
                >
                    <MenuItem onClick={handleDrawCircle}>
                        <img src="/icons/map-v2/circle.svg" alt="" width={22} height={22} style={{ marginRight: 8 }} /> Draw circle
                    </MenuItem>
                    <MenuItem onClick={handleDrawPolygon}>
                        <img src="/icons/map-v2/polygon.svg" alt="" width={22} height={22} style={{ marginRight: 8 }} /> Draw polygon
                    </MenuItem>
                </Menu>
            </Box>
        );
    },
);

UserDrawnGroup.displayName = 'UserDrawnGroup';

const ExposureView = ({
    onClose,
    scenarioId,
    selectedFocusAreaId,
    onFocusAreaSelect,
    exposureLayersData,
    isLoading: isLoadingLayers,
    isError: isErrorLayers,
}: ExposureViewProps) => {
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [mutationError, setMutationError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<{ title: string; subtitle: string } | null>(null);
    const [hasInitializedExpansion, setHasInitializedExpansion] = useState(false);
    const queryClient = useQueryClient();
    const currentFocusAreaId = selectedFocusAreaId ?? null;

    const editableUserDrawnLayers = useMemo(() => {
        return (
            exposureLayersData?.groups
                .flatMap((g) => g.exposureLayers)
                .filter((layer) => layer.isUserDefined && layer.isActive && layer.geometry && layer.status === 'unpublished') ?? []
        );
    }, [exposureLayersData]);

    const userEditableTypeId = useMemo(() => {
        return exposureLayersData?.groups.find((g) => g.isUserEditable)?.id;
    }, [exposureLayersData]);

    const { setDrawingConfig, drawingMode, startDrawing } = useDrawingContext();
    const { createExposureLayer, updateExposureLayer: updateExposureLayerMutate } = useExposureLayerMutations({
        scenarioId,
        focusAreaId: currentFocusAreaId,
        typeId: userEditableTypeId,
        onError: setMutationError,
    });

    const createExposureLayerRef = useRef(createExposureLayer);
    const updateExposureLayerMutateRef = useRef(updateExposureLayerMutate);
    useEffect(() => {
        createExposureLayerRef.current = createExposureLayer;
        updateExposureLayerMutateRef.current = updateExposureLayerMutate;
    }, [createExposureLayer, updateExposureLayerMutate]);

    useLayoutEffect(() => {
        if (!editableUserDrawnLayers || !userEditableTypeId) {
            setDrawingConfig(null);
            return;
        }

        setDrawingConfig({
            featureType: FEATURE_TYPES.EXPOSURE_LAYER,
            entities: editableUserDrawnLayers,
            getEntityId: (layer) => layer.id,
            getEntityGeometry: (layer) => layer.geometry ?? undefined,
            shouldRenderEntity: (layer) => !!layer.geometry,
            onCreate: (geometry) => createExposureLayerRef.current(geometry),
            onUpdate: (exposureLayerId, geometry) => updateExposureLayerMutateRef.current({ exposureLayerId, data: { geometry } }),
        });

        return () => setDrawingConfig(null);
    }, [editableUserDrawnLayers, userEditableTypeId, setDrawingConfig]);

    const isDrawing = drawingMode !== null;

    const invalidateQueries = useCallback(
        (typeId?: string) => {
            queryClient.invalidateQueries({ queryKey: ['exposureLayers', scenarioId] });
            queryClient.invalidateQueries({ queryKey: ['asset-score', scenarioId] });
            queryClient.invalidateQueries({ queryKey: ['scenarioAssets', scenarioId] });
            if (typeId === FLOODS_EXPOSURE_LAYER_TYPE_ID) {
                queryClient.invalidateQueries({ queryKey: ['roadRoute', scenarioId] });
            }
        },
        [queryClient, scenarioId],
    );

    const visibilityMutation = useMutation({
        mutationFn: (data: { exposureLayerId: string; isActive: boolean; typeId?: string }) => {
            if (!currentFocusAreaId) {
                return Promise.reject(new Error('No focus area selected'));
            }
            return toggleExposureLayerVisibility(scenarioId!, {
                exposureLayerId: data.exposureLayerId,
                focusAreaId: currentFocusAreaId,
                isActive: data.isActive,
            });
        },
        onSuccess: (_data, variables) => invalidateQueries(variables.typeId),
        onError: () => {
            setMutationError('Failed to update exposure layer visibility');
        },
    });

    const bulkVisibilityMutation = useMutation({
        mutationFn: (data: { typeId: string; isActive: boolean }) => {
            if (!currentFocusAreaId) {
                return Promise.reject(new Error('No focus area selected'));
            }
            return bulkToggleExposureLayerVisibility(scenarioId!, {
                focusAreaId: currentFocusAreaId,
                typeId: data.typeId,
                isActive: data.isActive,
            });
        },
        onSuccess: (_data, variables) => invalidateQueries(variables.typeId),
        onError: () => {
            setMutationError('Failed to update exposure layer visibility');
        },
    });

    const updateLayerMutation = useMutation({
        mutationFn: (data: { exposureLayerId: string; name: string }) => updateExposureLayer(scenarioId!, data.exposureLayerId, { name: data.name }),
        onSuccess: () => invalidateQueries(),
        onError: () => {
            setMutationError('Failed to update exposure layer');
        },
    });

    const deleteLayerMutation = useMutation({
        mutationFn: (exposureLayerId: string) => deleteExposureLayer(scenarioId!, exposureLayerId),
        onSuccess: () => invalidateQueries(),
        onError: () => {
            setMutationError('Failed to delete exposure layer');
        },
    });

    const publishLayerMutation = useMutation({
        mutationFn: (exposureLayerId: string) => publishExposureLayer(scenarioId!, exposureLayerId),
        onSuccess: (_data, exposureLayerId) => {
            const layer = exposureLayersData?.groups.flatMap((g) => g.exposureLayers).find((l) => l.id === exposureLayerId);
            setSuccessMessage({
                title: 'Exposure layer sent to Data Room',
                subtitle: `${layer?.name ?? 'Layer'} sent for Admin approval`,
            });
            invalidateQueries();
        },
        onError: () => {
            setMutationError('Failed to send exposure layer to Data Room');
        },
    });

    useEffect(() => {
        if (!exposureLayersData?.groups || hasInitializedExpansion) {
            return;
        }

        const groupNamesWithActiveLayers = getGroupNamesWithActiveLayers(exposureLayersData.groups);
        setExpandedGroups((prev) => {
            const next = new Set(prev);
            groupNamesWithActiveLayers.forEach((name) => {
                if (!next.has(name)) {
                    next.add(name);
                }
            });
            return next;
        });
        setHasInitializedExpansion(true);
    }, [exposureLayersData, hasInitializedExpansion]);

    const toggleGroup = useCallback((groupName: string) => {
        setExpandedGroups((prev) => {
            const next = new Set(prev);
            next.has(groupName) ? next.delete(groupName) : next.add(groupName);
            return next;
        });
    }, []);

    const toggleExposureLayer = useCallback(
        (layerId: string) => {
            const group = exposureLayersData?.groups.find((g) => g.exposureLayers.some((l) => l.id === layerId));
            const layer = group?.exposureLayers.find((l) => l.id === layerId);
            const currentState = layer?.isActive ?? false;
            const newState = !currentState;
            visibilityMutation.mutate({ exposureLayerId: layerId, isActive: newState, typeId: group?.id });
        },
        [exposureLayersData, visibilityMutation],
    );

    const handleBulkToggle = useCallback(
        (groupId: string, isActive: boolean) => {
            bulkVisibilityMutation.mutate({ typeId: groupId, isActive });
        },
        [bulkVisibilityMutation],
    );

    const handleUpdateLayer = useCallback(
        (layerId: string, name: string) => {
            updateLayerMutation.mutate({ exposureLayerId: layerId, name });
        },
        [updateLayerMutation],
    );

    const handleDeleteLayer = useCallback(
        (layerId: string) => {
            deleteLayerMutation.mutate(layerId);
        },
        [deleteLayerMutation],
    );

    const handlePublishLayer = useCallback(
        (layerId: string) => {
            publishLayerMutation.mutate(layerId);
        },
        [publishLayerMutation],
    );

    const { systemGroups, userDrawnGroup } = useMemo((): {
        systemGroups: Record<string, { id: string; name: string; layers: Feature[] }>;
        userDrawnGroup: { id: string; name: string; layers: ExposureLayer[] } | null;
    } => {
        if (!exposureLayersData?.groups || !exposureLayersData.featureCollection) {
            return { systemGroups: {}, userDrawnGroup: null };
        }

        const groups: Record<string, { id: string; name: string; layers: Feature[] }> = {};
        let userEditableGroup: { id: string; name: string; layers: ExposureLayer[] } | null = null;

        for (const group of exposureLayersData.groups) {
            if (group.isUserEditable) {
                userEditableGroup = { id: group.id, name: group.name, layers: group.exposureLayers };
                break;
            }
        }

        exposureLayersData.featureCollection.features.forEach((feature) => {
            const groupName = feature.properties?.groupName as string | undefined;
            const groupId = feature.properties?.groupId as string | undefined;
            const isUserDefined = feature.properties?.isUserDefined as boolean | undefined;

            if (!groupName || !groupId || isUserDefined) {
                return;
            }

            if (!groups[groupId]) {
                groups[groupId] = { id: groupId, name: groupName, layers: [] };
            }
            groups[groupId].layers.push(feature);
        });

        Object.values(groups).forEach((group) => {
            group.layers.sort((a, b) => {
                const nameA = (a.properties?.name as string) || '';
                const nameB = (b.properties?.name as string) || '';
                return nameA.localeCompare(nameB);
            });
        });

        return { systemGroups: groups, userDrawnGroup: userEditableGroup };
    }, [exposureLayersData]);

    const selectedExposureLayerIds = useMemo(() => {
        if (!exposureLayersData?.groups) {
            return {};
        }
        return buildLayerVisibilityMap(exposureLayersData.groups);
    }, [exposureLayersData]);

    const isFetchingExposureLayers = useIsFetching({ queryKey: ['exposureLayers', scenarioId] }) > 0;

    const isMutating =
        visibilityMutation.isPending ||
        bulkVisibilityMutation.isPending ||
        updateLayerMutation.isPending ||
        deleteLayerMutation.isPending ||
        publishLayerMutation.isPending ||
        isFetchingExposureLayers;

    if (!scenarioId) {
        return (
            <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" fontWeight={600}>
                        Exposure
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

    if (isErrorLayers) {
        return (
            <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" fontWeight={600}>
                        Exposure
                    </Typography>
                    <IconButton size="small" onClick={onClose} aria-label="Close panel">
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
                <Typography variant="body2" color="text.secondary">
                    Error loading exposure layers
                </Typography>
            </Box>
        );
    }

    return (
        <>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="h6" fontWeight={600}>
                        Exposure
                    </Typography>
                    <IconButton size="small" onClick={onClose} aria-label="Close panel">
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>

                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <FocusAreaSelector
                        scenarioId={scenarioId}
                        selectedFocusAreaId={currentFocusAreaId}
                        onFocusAreaSelect={onFocusAreaSelect ?? (() => {})}
                        label="Focus area"
                    />
                </Box>

                <Box sx={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
                    {isLoadingLayers && (
                        <Box sx={{ p: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                Loading exposure layers...
                            </Typography>
                        </Box>
                    )}

                    {!isLoadingLayers && Object.keys(systemGroups).length === 0 && !userDrawnGroup && (
                        <Box sx={{ p: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                No exposure layers found
                            </Typography>
                        </Box>
                    )}

                    {Object.entries(systemGroups).map(([groupId, groupData]) => (
                        <ExposureGroup
                            key={groupId}
                            groupId={groupData.id}
                            groupName={groupData.name}
                            layers={groupData.layers}
                            isExpanded={expandedGroups.has(groupData.name)}
                            selectedExposureLayerIds={selectedExposureLayerIds}
                            onToggleGroup={toggleGroup}
                            onToggleLayer={toggleExposureLayer}
                            onBulkToggle={handleBulkToggle}
                            disabled={isMutating}
                            showBulkToggle={groupData.name === 'Environmentally sensitive areas'}
                        />
                    ))}

                    {userDrawnGroup && scenarioId && (
                        <UserDrawnGroup
                            groupId={userDrawnGroup.id}
                            groupName={userDrawnGroup.name}
                            layers={userDrawnGroup.layers}
                            isExpanded={expandedGroups.has(userDrawnGroup.name)}
                            selectedExposureLayerIds={selectedExposureLayerIds}
                            onToggleGroup={toggleGroup}
                            onToggleLayer={toggleExposureLayer}
                            onBulkToggle={handleBulkToggle}
                            onUpdateLayer={handleUpdateLayer}
                            onDeleteLayer={handleDeleteLayer}
                            onPublishLayer={handlePublishLayer}
                            onStartDrawing={startDrawing}
                            disabled={isMutating}
                            isDrawing={isDrawing}
                        />
                    )}
                </Box>
            </Box>
            <Portal>
                <Snackbar
                    open={!!mutationError}
                    autoHideDuration={6000}
                    onClose={() => setMutationError(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert onClose={() => setMutationError(null)} severity="error" sx={{ width: '100%' }}>
                        {mutationError}
                    </Alert>
                </Snackbar>
                <Snackbar
                    open={!!successMessage}
                    autoHideDuration={6000}
                    onClose={() => setSuccessMessage(null)}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                    sx={{ marginTop: '36px' }}
                >
                    <Alert onClose={() => setSuccessMessage(null)} severity="success" sx={{ width: '100%' }}>
                        <AlertTitle>{successMessage?.title}</AlertTitle>
                        {successMessage?.subtitle}
                    </Alert>
                </Snackbar>
            </Portal>
        </>
    );
};

export default ExposureView;
