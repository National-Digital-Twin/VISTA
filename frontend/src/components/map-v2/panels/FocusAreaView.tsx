import { useState, useCallback, useEffect, useLayoutEffect, useRef, type ChangeEvent, type KeyboardEvent, type MouseEvent } from 'react';
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    Menu,
    MenuItem,
    Portal,
    Snackbar,
    TextField,
    Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { DeleteOutline, EditNoteOutlined } from '@mui/icons-material';
import useFocusAreaMutations from '../hooks/useFocusAreaMutations';
import { useDrawingContext } from '../context/DrawingContext';
import { FEATURE_TYPES } from '../constants';
import IconToggle from '@/components/IconToggle';
import type { FocusArea } from '@/api/focus-areas';

type FocusAreaViewProps = {
    readonly onClose: () => void;
    readonly scenarioId?: string;
    readonly selectedFocusAreaId?: string | null;
    readonly onFocusAreaSelect?: (focusAreaId: string | null) => void;
    readonly focusAreas?: FocusArea[];
    readonly isLoading?: boolean;
    readonly isError?: boolean;
};

type FocusAreaItemProps = {
    readonly focusArea: FocusArea;
    readonly scenarioId: string;
    readonly onError: (message: string) => void;
    readonly isSelected?: boolean;
    readonly onSelect?: (focusAreaId: string) => void;
};

const FocusAreaItem = ({ focusArea, scenarioId, onError, isSelected, onSelect }: FocusAreaItemProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(focusArea.name);
    const [nameError, setNameError] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const { updateFocusArea: updateFocusAreaMutate, deleteFocusArea: deleteFocusAreaMutate, isMutating } = useFocusAreaMutations({ scenarioId, onError });

    const handleClick = () => {
        onSelect?.(focusArea.id);
    };

    const handleEditClick = (e: MouseEvent) => {
        e.stopPropagation();
        setEditName(focusArea.name);
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
        if (trimmedName !== focusArea.name) {
            updateFocusAreaMutate({ focusAreaId: focusArea.id, data: { name: trimmedName } });
        }
    };

    const handleNameKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleNameBlur();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setEditName(focusArea.name);
            setNameError(null);
        }
    };

    const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        setEditName(e.target.value);
        if (nameError) {
            setNameError(null);
        }
    };

    const handleToggleVisibility = (e: MouseEvent | KeyboardEvent) => {
        e.stopPropagation();
        updateFocusAreaMutate({ focusAreaId: focusArea.id, data: { isActive: !focusArea.isActive } });
    };

    const handleDeleteClick = (e: MouseEvent) => {
        e.stopPropagation();
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = (e: MouseEvent) => {
        e.stopPropagation();
        setDeleteDialogOpen(false);
        deleteFocusAreaMutate(focusArea.id);
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
    };

    return (
        <Box
            onClick={handleClick}
            onDoubleClick={handleEditClick}
            sx={{
                'display': 'flex',
                'alignItems': 'center',
                'justifyContent': 'space-between',
                'py': 1,
                'px': 2,
                'cursor': 'pointer',
                'backgroundColor': isSelected ? 'action.selected' : 'transparent',
                '&:hover': {
                    backgroundColor: isSelected ? 'action.selected' : 'action.hover',
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
                        {focusArea.name}
                    </Typography>
                )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }} onDoubleClick={(e) => e.stopPropagation()}>
                <IconButton size="small" onClick={handleEditClick} disabled={isMutating} aria-label="Edit focus area name" title="Edit name">
                    <EditNoteOutlined fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={handleDeleteClick} disabled={isMutating} aria-label="Delete focus area" title="Delete">
                    <DeleteOutline fontSize="small" />
                </IconButton>
                <IconToggle
                    checked={focusArea.isActive}
                    onChange={handleToggleVisibility}
                    disabled={isMutating}
                    aria-label={focusArea.isActive ? 'Hide focus area' : 'Show focus area'}
                    size="small"
                />
            </Box>

            <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel} maxWidth="xs" fullWidth>
                <DialogTitle>Delete focus area</DialogTitle>
                <DialogContent>
                    <Typography variant="body1">Are you sure you want to delete "{focusArea.name || 'Unnamed focus area'}"?</Typography>
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
        </Box>
    );
};

const FocusAreaView = ({ onClose, scenarioId, selectedFocusAreaId, onFocusAreaSelect, focusAreas, isLoading, isError }: FocusAreaViewProps) => {
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [mutationError, setMutationError] = useState<string | null>(null);
    const menuOpen = Boolean(menuAnchorEl);

    const { setDrawingConfig, drawingMode, startDrawing } = useDrawingContext();

    const {
        createFocusArea,
        updateFocusArea: updateFocusAreaMutate,
        isMutating,
    } = useFocusAreaMutations({
        scenarioId,
        onError: setMutationError,
    });

    // Keep callbacks in refs to avoid recreating config objects
    const createFocusAreaRef = useRef(createFocusArea);
    const updateFocusAreaMutateRef = useRef(updateFocusAreaMutate);
    const onFocusAreaSelectRef = useRef(onFocusAreaSelect);
    const focusAreasRef = useRef(focusAreas);
    useEffect(() => {
        createFocusAreaRef.current = createFocusArea;
        updateFocusAreaMutateRef.current = updateFocusAreaMutate;
        onFocusAreaSelectRef.current = onFocusAreaSelect;
        focusAreasRef.current = focusAreas;
    }, [createFocusArea, updateFocusAreaMutate, onFocusAreaSelect, focusAreas]);

    // Drawing setup - register this panel's drawing config
    // useLayoutEffect runs before paint, preventing loading flash when data changes
    useLayoutEffect(() => {
        if (!focusAreas) {
            setDrawingConfig(null);
            return;
        }

        setDrawingConfig({
            featureType: FEATURE_TYPES.FOCUS_AREA,
            entities: focusAreas,
            selectedEntityId: selectedFocusAreaId,
            getEntityId: (fa) => fa.id,
            getEntityGeometry: (fa) => fa.geometry ?? undefined,
            shouldRenderEntity: (fa) => fa.isActive && !!fa.geometry,
            onCreate: (geometry) => createFocusAreaRef.current(geometry),
            onUpdate: (focusAreaId, geometry) => updateFocusAreaMutateRef.current({ focusAreaId, data: { geometry } }),
            onSelect: onFocusAreaSelectRef.current
                ? (id) => {
                      if (id && onFocusAreaSelectRef.current) {
                          onFocusAreaSelectRef.current(id);
                      } else if (onFocusAreaSelectRef.current) {
                          const mapWide = focusAreasRef.current?.find((fa) => fa.isSystem);
                          if (mapWide) {
                              onFocusAreaSelectRef.current(mapWide.id);
                          }
                      }
                  }
                : undefined,
        });

        return () => setDrawingConfig(null);
    }, [focusAreas, selectedFocusAreaId, setDrawingConfig]);

    const isDrawing = drawingMode !== null;

    const mapWideFocusArea = focusAreas?.find((fa) => fa.isSystem);
    const mapWideVisible = mapWideFocusArea?.isActive ?? true;

    const userFocusAreas = focusAreas?.filter((fa) => !fa.isSystem) ?? [];

    const handleDrawMenuClick = (event: MouseEvent<HTMLButtonElement>) => {
        setMenuAnchorEl(event.currentTarget);
    };

    const handleDrawCircle = useCallback(() => {
        setMenuAnchorEl(null);
        startDrawing('circle');
    }, [startDrawing]);

    const handleDrawPolygon = useCallback(() => {
        setMenuAnchorEl(null);
        startDrawing('polygon');
    }, [startDrawing]);

    const handleMapWideToggle = (e: MouseEvent | KeyboardEvent) => {
        e.stopPropagation();
        if (mapWideFocusArea) {
            updateFocusAreaMutate({ focusAreaId: mapWideFocusArea.id, data: { isActive: !mapWideVisible } });
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6" fontWeight={600}>
                    Focus area
                </Typography>
                <IconButton size="small" onClick={onClose} aria-label="Close panel">
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto' }}>
                <Box
                    onClick={() => mapWideFocusArea && onFocusAreaSelect?.(mapWideFocusArea.id)}
                    sx={{
                        'display': 'flex',
                        'alignItems': 'center',
                        'justifyContent': 'space-between',
                        'py': 1.5,
                        'px': 2,
                        'cursor': 'pointer',
                        'backgroundColor': selectedFocusAreaId === mapWideFocusArea?.id ? 'action.selected' : 'transparent',
                        '&:hover': {
                            backgroundColor: selectedFocusAreaId === mapWideFocusArea?.id ? 'action.selected' : 'action.hover',
                        },
                    }}
                >
                    <Typography variant="body2">Map-wide</Typography>
                    <IconToggle
                        checked={mapWideVisible}
                        onChange={handleMapWideToggle}
                        disabled={isMutating}
                        aria-label={mapWideVisible ? 'Hide map-wide assets' : 'Show map-wide assets'}
                        size="small"
                    />
                </Box>

                <Divider />

                {!scenarioId && (
                    <Box sx={{ p: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            No scenario selected
                        </Typography>
                    </Box>
                )}

                {scenarioId && isLoading && (
                    <Box sx={{ p: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Loading focus areas...
                        </Typography>
                    </Box>
                )}

                {scenarioId && isError && (
                    <Box sx={{ p: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Error loading focus areas
                        </Typography>
                    </Box>
                )}

                {scenarioId &&
                    !isLoading &&
                    !isError &&
                    userFocusAreas.map((focusArea) => (
                        <FocusAreaItem
                            key={focusArea.id}
                            focusArea={focusArea}
                            scenarioId={scenarioId}
                            onError={setMutationError}
                            isSelected={selectedFocusAreaId === focusArea.id}
                            onSelect={onFocusAreaSelect}
                        />
                    ))}

                <Box sx={{ display: 'flex', justifyContent: 'center', m: 2 }}>
                    <Button
                        variant="contained"
                        startIcon={<AddCircleIcon />}
                        onClick={handleDrawMenuClick}
                        disabled={!scenarioId || isDrawing}
                        sx={{
                            textTransform: 'uppercase',
                            fontWeight: 500,
                        }}
                    >
                        Draw new focus area
                    </Button>
                </Box>
            </Box>
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

export default FocusAreaView;
