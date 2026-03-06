// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { DeleteOutline, EditNoteOutlined } from '@mui/icons-material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CloseIcon from '@mui/icons-material/Close';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
    Alert,
    Box,
    Button,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Menu,
    MenuItem,
    Portal,
    Snackbar,
    TextField,
    Typography,
} from '@mui/material';
import { useState, useCallback, useEffect, useLayoutEffect, useMemo, useRef, type ChangeEvent, type KeyboardEvent, type MouseEvent } from 'react';
import { FEATURE_TYPES } from '../constants';
import { useDrawingContext } from '../context/DrawingContext';
import useConstraintInterventionMutations from '../hooks/useConstraintInterventionMutations';
import type { ConstraintIntervention, ConstraintInterventionType, UpdateConstraintInterventionRequest } from '@/api/constraint-interventions';
import IconToggle from '@/components/IconToggle';
import { singularize } from '@/utils';

type UpdateConstraintParams = { interventionId: string; data: UpdateConstraintInterventionRequest };

type ConstraintItemProps = {
    readonly intervention: ConstraintIntervention;
    readonly onUpdate: (params: UpdateConstraintParams) => void;
    readonly onDelete: (interventionId: string) => void;
    readonly isMutating: boolean;
    readonly isSelected?: boolean;
    readonly onSelect?: (interventionId: string) => void;
};

const ConstraintItem = ({ intervention, onUpdate, onDelete, isMutating, isSelected, onSelect }: ConstraintItemProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(intervention.name);
    const [nameError, setNameError] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const handleClick = () => {
        onSelect?.(intervention.id);
    };

    const handleEditClick = (e: MouseEvent) => {
        e.stopPropagation();
        setEditName(intervention.name);
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
        if (trimmedName !== intervention.name) {
            onUpdate({ interventionId: intervention.id, data: { name: trimmedName } });
        }
    };

    const handleNameKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleNameBlur();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setEditName(intervention.name);
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
        onUpdate({ interventionId: intervention.id, data: { isActive: !intervention.isActive } });
    };

    const handleDeleteClick = (e: MouseEvent) => {
        e.stopPropagation();
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = (e: MouseEvent) => {
        e.stopPropagation();
        setDeleteDialogOpen(false);
        onDelete(intervention.id);
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
                        {intervention.name}
                    </Typography>
                )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }} onDoubleClick={(e) => e.stopPropagation()}>
                <IconButton size="small" onClick={handleEditClick} disabled={isMutating} aria-label="Edit constraint name" title="Edit name">
                    <EditNoteOutlined fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={handleDeleteClick} disabled={isMutating} aria-label="Delete constraint" title="Delete">
                    <DeleteOutline fontSize="small" />
                </IconButton>
                <IconToggle
                    checked={intervention.isActive}
                    onChange={handleToggleVisibility}
                    disabled={isMutating}
                    aria-label={intervention.isActive ? 'Hide constraint' : 'Show constraint'}
                    size="small"
                />
            </Box>

            <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel} maxWidth="xs" fullWidth>
                <DialogTitle>Delete constraint</DialogTitle>
                <DialogContent>
                    <Typography variant="body1">Are you sure you want to delete &quot;{intervention.name}&quot;?</Typography>
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

type ConstraintTypeGroupProps = {
    readonly constraintType: ConstraintInterventionType;
    readonly onUpdate: (params: UpdateConstraintParams) => void;
    readonly onDelete: (interventionId: string) => void;
    readonly isMutating: boolean;
    readonly selectedInterventionId?: string | null;
    readonly onSelect?: (interventionId: string) => void;
    readonly isExpanded: boolean;
    readonly onToggleExpanded: () => void;
    readonly isDrawing: boolean;
    readonly onStartDrawing: (typeId: string, mode: 'line' | 'polygon') => void;
};

const ConstraintTypeGroup = ({
    constraintType,
    onUpdate,
    onDelete,
    isMutating,
    selectedInterventionId,
    onSelect,
    isExpanded,
    onToggleExpanded,
    isDrawing,
    onStartDrawing,
}: ConstraintTypeGroupProps) => {
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const menuOpen = Boolean(menuAnchorEl);
    const singularName = singularize(constraintType.name).toLowerCase();

    return (
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Button
                onClick={onToggleExpanded}
                fullWidth
                sx={{
                    'display': 'flex',
                    'alignItems': 'center',
                    'justifyContent': 'flex-start',
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
                >
                    {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </Box>
                <Typography variant="body1" sx={{ flexGrow: 1, fontWeight: 500, textAlign: 'left' }}>
                    {constraintType.name}
                </Typography>
            </Button>

            <Collapse in={isExpanded}>
                {constraintType.constraintInterventions.map((intervention) => (
                    <ConstraintItem
                        key={intervention.id}
                        intervention={intervention}
                        onUpdate={onUpdate}
                        onDelete={onDelete}
                        isMutating={isMutating}
                        isSelected={selectedInterventionId === intervention.id}
                        onSelect={onSelect}
                    />
                ))}

                <Box sx={{ display: 'flex', justifyContent: 'center', m: 2 }}>
                    <Button
                        variant="contained"
                        startIcon={<AddCircleIcon />}
                        onClick={(e) => setMenuAnchorEl(e.currentTarget)}
                        disabled={isDrawing || isMutating}
                        sx={{ textTransform: 'uppercase', fontWeight: 500 }}
                    >
                        {`Draw new ${singularName}`}
                    </Button>
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
                    '& .MuiMenuItem-root': { padding: '1rem' },
                }}
            >
                <MenuItem
                    onClick={() => {
                        setMenuAnchorEl(null);
                        onStartDrawing(constraintType.id, 'line');
                    }}
                >
                    <img src="/icons/map-v2/segment.svg" alt="" width={22} height={22} style={{ marginRight: 8 }} /> Draw segment
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        setMenuAnchorEl(null);
                        onStartDrawing(constraintType.id, 'polygon');
                    }}
                >
                    <img src="/icons/map-v2/polygon.svg" alt="" width={22} height={22} style={{ marginRight: 8 }} /> Draw polygon
                </MenuItem>
            </Menu>
        </Box>
    );
};

type ConstraintsViewProps = {
    readonly onClose: () => void;
    readonly scenarioId?: string;
    readonly constraintTypes?: ConstraintInterventionType[];
    readonly isLoading?: boolean;
    readonly isError?: boolean;
};

const ConstraintsView = ({ onClose, scenarioId, constraintTypes, isLoading, isError }: ConstraintsViewProps) => {
    const [mutationError, setMutationError] = useState<string | null>(null);
    const [selectedInterventionId, setSelectedInterventionId] = useState<string | null>(null);
    const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

    const { setDrawingConfig, drawingMode, startDrawing } = useDrawingContext();

    const drawingTypeIdRef = useRef<string | null>(null);

    const { createConstraint, updateConstraint, deleteConstraint, isMutating } = useConstraintInterventionMutations({
        scenarioId,
        onError: setMutationError,
    });

    const allInterventions = useMemo(() => constraintTypes?.flatMap((ct) => ct.constraintInterventions) ?? [], [constraintTypes]);

    const createConstraintRef = useRef(createConstraint);
    const updateConstraintRef = useRef(updateConstraint);
    const onSelectRef = useRef(setSelectedInterventionId);
    useEffect(() => {
        createConstraintRef.current = createConstraint;
        updateConstraintRef.current = updateConstraint;
        onSelectRef.current = setSelectedInterventionId;
    }, [createConstraint, updateConstraint, setSelectedInterventionId]);

    useEffect(() => {
        if (constraintTypes && constraintTypes.length > 0) {
            setExpandedTypes(new Set(constraintTypes.map((ct) => ct.id)));
        }
    }, [constraintTypes]);

    useLayoutEffect(() => {
        if (!constraintTypes) {
            setDrawingConfig(null);
            return;
        }

        setDrawingConfig({
            featureType: FEATURE_TYPES.CONSTRAINT,
            entities: allInterventions,
            selectedEntityId: selectedInterventionId,
            getEntityId: (i) => i.id,
            getEntityGeometry: (i) => i.geometry,
            shouldRenderEntity: (i) => i.isActive,
            onCreate: (geometry) => createConstraintRef.current({ typeId: drawingTypeIdRef.current!, geometry }),
            onUpdate: (interventionId, geometry) => updateConstraintRef.current({ interventionId, data: { geometry } }),
            onSelect: (id) => onSelectRef.current(id),
        });

        return () => setDrawingConfig(null);
    }, [constraintTypes, allInterventions, selectedInterventionId, setDrawingConfig]);

    const isDrawing = drawingMode !== null;

    const handleStartDrawing = useCallback(
        (typeId: string, mode: 'line' | 'polygon') => {
            drawingTypeIdRef.current = typeId;
            startDrawing(mode);
        },
        [startDrawing],
    );

    const handleToggleExpanded = useCallback((typeId: string) => {
        setExpandedTypes((prev) => {
            const next = new Set(prev);
            next.has(typeId) ? next.delete(typeId) : next.add(typeId);
            return next;
        });
    }, []);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6" fontWeight={600}>
                    Constraints
                </Typography>
                <IconButton size="small" onClick={onClose} aria-label="Close panel">
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto' }}>
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
                            Loading constraints...
                        </Typography>
                    </Box>
                )}

                {scenarioId && isError && (
                    <Box sx={{ p: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Error loading constraints
                        </Typography>
                    </Box>
                )}

                {scenarioId &&
                    !isLoading &&
                    !isError &&
                    constraintTypes?.map((ct) => (
                        <ConstraintTypeGroup
                            key={ct.id}
                            constraintType={ct}
                            onUpdate={updateConstraint}
                            onDelete={deleteConstraint}
                            isMutating={isMutating}
                            selectedInterventionId={selectedInterventionId}
                            onSelect={setSelectedInterventionId}
                            isExpanded={expandedTypes.has(ct.id)}
                            onToggleExpanded={() => handleToggleExpanded(ct.id)}
                            isDrawing={isDrawing}
                            onStartDrawing={handleStartDrawing}
                        />
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

export default ConstraintsView;
