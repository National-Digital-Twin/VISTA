// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Link,
    MenuItem,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isToday } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, Navigate, useNavigate, useParams } from 'react-router-dom';
import { approveExposureLayer, fetchDataroomExposureLayers, rejectExposureLayer, removeExposureLayer, type DataroomExposureLayer } from '@/api/exposure-layers';
import { fetchScenarios, type Scenario } from '@/api/scenarios';
import DataroomMap from '@/components/DataroomMap';
import PendingExposureOutlines from '@/components/DataroomMap/PendingExposureOutlines';
import { TableRowMenu, TableRowMenuButton } from '@/components/TableRowMenu';
import { useUserData } from '@/hooks/useUserData';

const TABLE_ROW_HEIGHT = 52;

const tableCellSx = {
    height: TABLE_ROW_HEIGHT,
    verticalAlign: 'middle' as const,
    boxSizing: 'border-box' as const,
};

const dialogActionsSx = { p: 3, pt: 0, mt: 2 };
const cancelButtonSx = { flex: 1, mr: 1, height: 48, borderRadius: 1 };
const confirmButtonSx = { flex: 2, height: 48, borderRadius: 1 };

type LayerWithGeometry = { id: string; geometry: NonNullable<DataroomExposureLayer['geometry']> };

function layersWithGeometry(layers: DataroomExposureLayer[]): LayerWithGeometry[] {
    return layers
        .filter((l): l is DataroomExposureLayer & { geometry: NonNullable<DataroomExposureLayer['geometry']> } => !!l.geometry)
        .map((l) => ({ id: l.id, geometry: l.geometry }));
}

function formatRequestSent(dateStr: string | undefined): string {
    if (!dateStr) {
        return '—';
    }
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) {
        return '—';
    }
    return isToday(date) ? 'Today' : format(date, 'd MMM yyyy');
}

type VisibilityToggleHeaderProps = {
    title: string;
    visible: boolean;
    onToggle: () => void;
    ariaLabelWhenVisible: string;
    ariaLabelWhenHidden: string;
};

function VisibilityToggleHeader({ title, visible, onToggle, ariaLabelWhenVisible, ariaLabelWhenHidden }: Readonly<VisibilityToggleHeaderProps>) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>
                {title}
            </Typography>
            <IconButton
                size="small"
                onClick={onToggle}
                aria-label={visible ? ariaLabelWhenVisible : ariaLabelWhenHidden}
                color={visible ? 'primary' : 'default'}
            >
                {visible ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
            </IconButton>
        </Box>
    );
}

function OwnerCell({ layer }: Readonly<{ layer: DataroomExposureLayer }>) {
    return (
        <TableCell sx={tableCellSx}>
            {layer.user ? (
                <Link component={RouterLink} to={`/user/${layer.user.id}`} underline="hover" color="primary" onClick={(e) => e.stopPropagation()}>
                    {layer.user.name ?? '—'}
                </Link>
            ) : (
                '—'
            )}
        </TableCell>
    );
}

type ConfirmLayerDialogProps = {
    open: boolean;
    onClose: () => void;
    title: string;
    description: string;
    confirmLabel: string;
    confirmColor?: 'primary' | 'error';
    onConfirm: () => void;
    isPending: boolean;
    layerName: string;
};

function ConfirmLayerDialog({
    open,
    onClose,
    title,
    description,
    confirmLabel,
    confirmColor = 'primary',
    onConfirm,
    isPending,
    layerName,
}: Readonly<ConfirmLayerDialogProps>) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {title}
                <IconButton onClick={onClose} size="small" aria-label="Close">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <Typography variant="body1" sx={{ mb: 1 }}>
                    {description}
                </Typography>
                <Typography variant="body1">
                    Are you sure you want to {confirmLabel.toLowerCase()} &quot;{layerName}&quot;?
                </Typography>
            </DialogContent>
            <DialogActions sx={dialogActionsSx}>
                <Button onClick={onClose} variant="outlined" sx={cancelButtonSx}>
                    CANCEL
                </Button>
                <Button onClick={onConfirm} color={confirmColor} variant="contained" disabled={isPending} sx={confirmButtonSx}>
                    {confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default function ManageScenario() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { isAdmin, loading: userLoading } = useUserData();

    const { data: scenarios, isLoading: scenariosLoading } = useQuery<Scenario[], Error>({
        queryKey: ['scenarios'],
        queryFn: fetchScenarios,
        staleTime: 5 * 60 * 1000,
    });

    const { data: layers = [], isLoading: layersLoading } = useQuery<DataroomExposureLayer[], Error>({
        queryKey: ['dataroom-exposure-layers', id],
        queryFn: () => {
            if (!id) {
                throw new Error('Scenario id required');
            }
            return fetchDataroomExposureLayers(id);
        },
        enabled: !!id && !!isAdmin,
        staleTime: 60 * 1000,
    });

    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [approveModal, setApproveModal] = useState<DataroomExposureLayer | null>(null);
    const [rejectModal, setRejectModal] = useState<DataroomExposureLayer | null>(null);
    const [removeModal, setRemoveModal] = useState<DataroomExposureLayer | null>(null);
    const [availableMenuAnchor, setAvailableMenuAnchor] = useState<{ el: HTMLElement; layer: DataroomExposureLayer } | null>(null);
    const [requestsLayersVisible, setRequestsLayersVisible] = useState(true);
    const [availableLayersVisible, setAvailableLayersVisible] = useState(false);
    const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

    const scenario = scenarios?.find((s) => s.id === id);
    const requests = layers.filter((l) => l.status === 'pending');
    const pendingExposureLayers = useMemo(() => layersWithGeometry(requests), [requests]);
    const available = layers.filter((l) => l.status === 'approved' || !l.isUserDefined);
    const availableExposureLayersWithGeometry = useMemo(() => layersWithGeometry(available), [available]);
    const exposureLayersForMap = useMemo(() => {
        const fromRequests = requestsLayersVisible ? pendingExposureLayers : [];
        const fromAvailable = availableLayersVisible ? availableExposureLayersWithGeometry : [];
        return [...fromRequests, ...fromAvailable];
    }, [requestsLayersVisible, availableLayersVisible, pendingExposureLayers, availableExposureLayersWithGeometry]);

    useEffect(() => {
        if (!selectedLayerId) {
            return;
        }
        const selectedInRequests = requests.some((l) => l.id === selectedLayerId);
        const selectedInAvailable = available.some((l) => l.id === selectedLayerId);
        if ((!requestsLayersVisible && selectedInRequests) || (!availableLayersVisible && selectedInAvailable)) {
            setSelectedLayerId(null);
        }
    }, [requestsLayersVisible, availableLayersVisible, selectedLayerId, requests, available]);

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['dataroom-exposure-layers', id] });
        queryClient.invalidateQueries({ queryKey: ['scenarios'] });
    };

    const approveMutation = useMutation({
        mutationFn: ({ layer }: { layer: DataroomExposureLayer }) => {
            if (!id) {
                throw new Error('Scenario id required');
            }
            return approveExposureLayer(id, layer.id);
        },
        onSuccess: (_data, { layer }) => {
            setApproveModal(null);
            setSuccessMessage(`Exposure layer approved '${layer.name}' is now available to all`);
            invalidate();
        },
        onError: (err: Error) => setErrorMessage(err.message ?? 'Failed to approve'),
    });

    const rejectMutation = useMutation({
        mutationFn: ({ layer }: { layer: DataroomExposureLayer }) => {
            if (!id) {
                throw new Error('Scenario id required');
            }
            return rejectExposureLayer(id, layer.id);
        },
        onSuccess: (_data, { layer }) => {
            setRejectModal(null);
            setSuccessMessage(`Exposure layer rejected '${layer.name}' has been removed`);
            invalidate();
        },
        onError: (err: Error) => setErrorMessage(err.message ?? 'Failed to reject'),
    });

    const removeMutation = useMutation({
        mutationFn: ({ layer }: { layer: DataroomExposureLayer }) => {
            if (!id) {
                throw new Error('Scenario id required');
            }
            return removeExposureLayer(id, layer.id);
        },
        onSuccess: (_data, { layer }) => {
            setRemoveModal(null);
            setSuccessMessage(`Exposure layer removed '${layer.name}' is now not available to all`);
            invalidate();
        },
        onError: (err: Error) => setErrorMessage(err.message ?? 'Failed to remove'),
    });

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
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton onClick={() => navigate('/data-room/scenarios')} size="small" aria-label="Back to scenarios">
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
                <Button variant="contained" startIcon={<EditIcon />} onClick={() => navigate(`/data-room/scenarios/${id}/edit`)}>
                    EDIT
                </Button>
            </Box>

            <Box sx={{ height: 350, border: 1, borderColor: 'divider', overflow: 'hidden', mb: 3 }}>
                <DataroomMap height="100%">
                    {exposureLayersForMap.length > 0 ? <PendingExposureOutlines layers={exposureLayersForMap} highlightedLayerId={selectedLayerId} /> : null}
                </DataroomMap>
            </Box>

            {layersLoading ? (
                <Typography color="text.secondary">Loading exposure layers...</Typography>
            ) : (
                <>
                    {requests.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                            <VisibilityToggleHeader
                                title="Requests"
                                visible={requestsLayersVisible}
                                onToggle={() => setRequestsLayersVisible((v) => !v)}
                                ariaLabelWhenVisible="Hide request layers on map"
                                ariaLabelWhenHidden="Show request layers on map"
                            />
                            <TableContainer>
                                <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ width: '25%' }}>Exposure</TableCell>
                                            <TableCell sx={{ width: '25%' }}>Owner</TableCell>
                                            <TableCell sx={{ width: '25%' }}>Request sent</TableCell>
                                            <TableCell sx={{ width: '25%' }} align="right" />
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {requests.map((layer) => {
                                            const isSelected = selectedLayerId === layer.id;
                                            return (
                                                <TableRow
                                                    key={layer.id}
                                                    hover
                                                    sx={{
                                                        height: TABLE_ROW_HEIGHT,
                                                        ...(isSelected && { backgroundColor: 'action.selected' }),
                                                    }}
                                                    onClick={() => setSelectedLayerId((prev) => (prev === layer.id ? null : layer.id))}
                                                >
                                                    <TableCell sx={tableCellSx}>{layer.name}</TableCell>
                                                    <OwnerCell layer={layer} />
                                                    <TableCell sx={tableCellSx}>{formatRequestSent(layer.createdAt)}</TableCell>
                                                    <TableCell align="right" sx={tableCellSx} onClick={(e) => e.stopPropagation()}>
                                                        <Button
                                                            variant="outlined"
                                                            color="error"
                                                            size="small"
                                                            sx={{ mr: 0.5 }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setRejectModal(layer);
                                                            }}
                                                        >
                                                            REJECT
                                                        </Button>
                                                        <Button
                                                            variant="contained"
                                                            size="small"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setApproveModal(layer);
                                                            }}
                                                        >
                                                            APPROVE
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}

                    <Box>
                        <VisibilityToggleHeader
                            title="Available"
                            visible={availableLayersVisible}
                            onToggle={() => setAvailableLayersVisible((v) => !v)}
                            ariaLabelWhenVisible="Hide available layers on map"
                            ariaLabelWhenHidden="Show available layers on map"
                        />
                        <TableContainer>
                            <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ width: '25%' }}>Data source</TableCell>
                                        <TableCell sx={{ width: '25%' }}>Owner</TableCell>
                                        <TableCell sx={{ width: '25%' }}>Type</TableCell>
                                        <TableCell sx={{ width: '25%' }}>Last updated</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {available.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                                                <Typography color="text.secondary">No exposure layers available.</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        available.map((layer) => {
                                            const isSelected = selectedLayerId === layer.id;
                                            return (
                                                <TableRow
                                                    key={layer.id}
                                                    hover
                                                    sx={{
                                                        height: TABLE_ROW_HEIGHT,
                                                        ...(isSelected && { backgroundColor: 'action.selected' }),
                                                    }}
                                                    onClick={() => setSelectedLayerId((prev) => (prev === layer.id ? null : layer.id))}
                                                >
                                                    <TableCell sx={tableCellSx}>{layer.name}</TableCell>
                                                    <OwnerCell layer={layer} />
                                                    <TableCell sx={tableCellSx}>{layer.isUserDefined ? 'User drawn' : 'Data driven'}</TableCell>
                                                    <TableCell sx={tableCellSx} onClick={(e) => e.stopPropagation()}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                                            <span>{formatRequestSent(layer.updatedAt ?? layer.createdAt)}</span>
                                                            {layer.status === 'approved' && layer.isUserDefined ? (
                                                                <TableRowMenuButton
                                                                    aria-label="More actions"
                                                                    open={availableMenuAnchor?.layer.id === layer.id}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setAvailableMenuAnchor({ el: e.currentTarget, layer });
                                                                    }}
                                                                />
                                                            ) : null}
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </>
            )}

            <TableRowMenu anchorEl={availableMenuAnchor?.el ?? null} open={!!availableMenuAnchor} onClose={() => setAvailableMenuAnchor(null)}>
                <MenuItem
                    onClick={() => {
                        if (availableMenuAnchor) {
                            setRemoveModal(availableMenuAnchor.layer);
                            setAvailableMenuAnchor(null);
                        }
                    }}
                    sx={{ color: 'error.main' }}
                >
                    Remove
                </MenuItem>
            </TableRowMenu>

            <ConfirmLayerDialog
                open={!!approveModal}
                onClose={() => setApproveModal(null)}
                title="Approve exposure layer"
                description="Approving this exposure layer will mean it will be available to everyone in this scenario"
                confirmLabel="APPROVE"
                onConfirm={() => approveModal && approveMutation.mutate({ layer: approveModal })}
                isPending={approveMutation.isPending}
                layerName={approveModal?.name ?? ''}
            />
            <ConfirmLayerDialog
                open={!!rejectModal}
                onClose={() => setRejectModal(null)}
                title="Reject exposure layer"
                description="Rejecting this exposure layer will mean a user will have to submit it again."
                confirmLabel="REJECT"
                confirmColor="error"
                onConfirm={() => rejectModal && rejectMutation.mutate({ layer: rejectModal })}
                isPending={rejectMutation.isPending}
                layerName={rejectModal?.name ?? ''}
            />
            <ConfirmLayerDialog
                open={!!removeModal}
                onClose={() => setRemoveModal(null)}
                title="Remove exposure layer"
                description="Removing this exposure layer will mean a user will have to submit it again."
                confirmLabel="REMOVE"
                confirmColor="error"
                onConfirm={() => removeModal && removeMutation.mutate({ layer: removeModal })}
                isPending={removeMutation.isPending}
                layerName={removeModal?.name ?? ''}
            />

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
            <Snackbar
                open={!!successMessage}
                autoHideDuration={5000}
                onClose={() => setSuccessMessage(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity="success" onClose={() => setSuccessMessage(null)}>
                    {successMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}
