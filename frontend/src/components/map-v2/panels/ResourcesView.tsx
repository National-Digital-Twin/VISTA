import { ExpandMore, Close, InventoryOutlined } from '@mui/icons-material';
import {
    Box,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    List,
    ListItem,
    ListItemText,
    ListItemButton,
    IconButton,
    LinearProgress,
    Button,
    Snackbar,
    Alert,
    CircularProgress,
    Portal,
} from '@mui/material';
import { useState, useEffect } from 'react';
import useResourceMutations from '../hooks/useResourceMutations';
import ResourceUsageLog from './ResourceUsageLog';
import StockActionDialog from './StockActionDialog';
import type { ResourceType } from '@/api/resources';
import IconToggle from '@/components/IconToggle';
import { percentage } from '@/utils';
import { getStockColor } from '@/utils/stockLevels';

interface ResourcesViewProps {
    onClose: () => void;
    scenarioId?: string;
    resourceTypes?: ResourceType[];
    isLoading: boolean;
    isError: boolean;
    selectedLocationId?: string | null;
    stockActionOpen?: boolean;
    onLocationSelect?: (locationId: string) => void;
    onStockActionClose?: () => void;
}

export const ResourcesView = ({
    onClose,
    scenarioId,
    resourceTypes,
    isLoading,
    isError,
    selectedLocationId,
    stockActionOpen,
    onLocationSelect,
    onStockActionClose,
}: ResourcesViewProps) => {
    const [expandedTypes, setExpandedTypes] = useState<Set<string>>(() => new Set(resourceTypes?.filter((t) => t.isActive).map((t) => t.id) ?? []));
    const [actionModalOpen, setActionModalOpen] = useState(false);
    const [usageLogType, setUsageLogType] = useState<{ id: string; name: string } | null>(null);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const { withdrawStock, restockLocation, toggleVisibility, isMutating } = useResourceMutations({
        scenarioId,
        onError: (message) => showSnackbar(message, 'error'),
    });

    useEffect(() => {
        if (resourceTypes?.length) {
            setExpandedTypes((prev) => {
                if (prev.size > 0) {
                    return prev;
                }
                return new Set(resourceTypes.filter((t) => t.isActive).map((t) => t.id));
            });
        }
    }, [resourceTypes]);

    useEffect(() => {
        if (!selectedLocationId) {
            return;
        }
        const typeWithLocation = resourceTypes?.find((type) => type.locations.some((loc) => loc.id === selectedLocationId));
        if (typeWithLocation) {
            setExpandedTypes((prev) => new Set([...prev, typeWithLocation.id]));
        }
    }, [selectedLocationId, resourceTypes]);

    useEffect(() => {
        if (stockActionOpen) {
            setActionModalOpen(true);
        }
    }, [stockActionOpen]);

    const handleToggleExpand = (typeId: string) => {
        const newExpanded = new Set(expandedTypes);
        if (newExpanded.has(typeId)) {
            newExpanded.delete(typeId);
        } else {
            newExpanded.add(typeId);
        }
        setExpandedTypes(newExpanded);
    };

    const handleToggleTypeVisibility = (typeId: string, isCurrentlyActive: boolean) => {
        toggleVisibility(
            { resourceTypeId: typeId, isActive: !isCurrentlyActive },
            {
                onSuccess: () => {
                    if (!isCurrentlyActive) {
                        setExpandedTypes((prev) => new Set([...prev, typeId]));
                    }
                },
            },
        );
    };

    const handleLocationSelect = (locationId: string) => {
        onLocationSelect?.(locationId);
    };

    const handleLocationAction = (locationId: string) => {
        onLocationSelect?.(locationId);
        setActionModalOpen(true);
    };

    const handleActionDialogClose = () => {
        setActionModalOpen(false);
        onStockActionClose?.();
    };

    if (isLoading) {
        return (
            <Box p={2}>
                <CircularProgress />
            </Box>
        );
    }

    if (isError) {
        return (
            <Box p={2}>
                <Typography color="error">Failed to load resources</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6">Resources</Typography>
                <IconButton onClick={onClose} size="small" aria-label="Close">
                    <Close />
                </IconButton>
            </Box>

            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                {resourceTypes?.map((type) => (
                    <Box key={type.id} sx={{ position: 'relative' }}>
                        <Accordion expanded={expandedTypes.has(type.id)} onChange={() => handleToggleExpand(type.id)}>
                            <AccordionSummary
                                expandIcon={<ExpandMore />}
                                sx={{
                                    '&.Mui-expanded': { minHeight: 48 },
                                    '& .MuiAccordionSummary-content.Mui-expanded': { margin: '12px 0' },
                                }}
                            >
                                <Typography>
                                    {type.name} ({type.locations.length})
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 0 }}>
                                <List dense>
                                    {type.locations.map((location) => (
                                        <ListItem key={location.id} disablePadding>
                                            <ListItemButton
                                                selected={selectedLocationId === location.id || false}
                                                onClick={() => handleLocationSelect(location.id)}
                                                onDoubleClick={() => handleLocationAction(location.id)}
                                            >
                                                <ListItemText
                                                    primary={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                            <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                                                                {location.name}
                                                            </Typography>
                                                            <IconButton
                                                                size="small"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleLocationAction(location.id);
                                                                }}
                                                                disabled={isMutating}
                                                                aria-label={`Manage stock for ${location.name}`}
                                                                title="Manage stock"
                                                            >
                                                                <InventoryOutlined fontSize="small" />
                                                            </IconButton>
                                                        </Box>
                                                    }
                                                    secondary={
                                                        <>
                                                            <Typography component="span" variant="body2" display="block" sx={{ mb: 0.5 }}>
                                                                {location.currentStock} / {location.maxCapacity} {type.unit}
                                                            </Typography>
                                                            <LinearProgress
                                                                variant="determinate"
                                                                value={percentage(location.currentStock, location.maxCapacity)}
                                                                sx={{
                                                                    'height': 8,
                                                                    'borderRadius': 4,
                                                                    '& .MuiLinearProgress-bar': {
                                                                        backgroundColor: getStockColor(location.currentStock, location.maxCapacity),
                                                                    },
                                                                }}
                                                            />
                                                        </>
                                                    }
                                                />
                                            </ListItemButton>
                                        </ListItem>
                                    ))}
                                </List>
                                <Button size="small" onClick={() => setUsageLogType({ id: type.id, name: type.name })} sx={{ ml: 2, mb: 1 }}>
                                    View inventory log →
                                </Button>
                            </AccordionDetails>
                        </Accordion>
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                right: 48,
                                height: 48,
                                display: 'flex',
                                alignItems: 'center',
                                zIndex: 1,
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <IconToggle
                                checked={type.isActive}
                                onChange={() => handleToggleTypeVisibility(type.id, type.isActive)}
                                disabled={isMutating}
                                aria-label={type.isActive ? `Hide ${type.name}` : `Show ${type.name}`}
                                size="small"
                            />
                        </Box>
                    </Box>
                ))}
            </Box>

            <StockActionDialog
                open={actionModalOpen}
                onClose={handleActionDialogClose}
                scenarioId={scenarioId}
                locationId={selectedLocationId ?? null}
                withdrawStock={withdrawStock}
                restockLocation={restockLocation}
                isMutating={isMutating}
                onSuccess={showSnackbar}
            />

            <ResourceUsageLog
                open={!!usageLogType}
                onClose={() => setUsageLogType(null)}
                scenarioId={scenarioId}
                typeId={usageLogType?.id}
                typeName={usageLogType?.name}
            />

            <Portal>
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                    <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Portal>
        </Box>
    );
};

export default ResourcesView;
