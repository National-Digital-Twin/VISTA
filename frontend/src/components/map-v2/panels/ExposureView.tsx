import { useCallback, useMemo, useState } from 'react';
import { Box, IconButton, Typography, ListItem, ListItemText, Collapse } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useQuery } from '@tanstack/react-query';
import type { Feature } from 'geojson';

import { fetchExposureLayers } from '@/api/exposure-layers';
import ToggleSwitch from '@/components/ToggleSwitch';

interface ExposureViewProps {
    readonly onClose: () => void;
    readonly selectedExposureLayerIds?: Record<string, boolean>;
    readonly onExposureLayerToggle?: (layerId: string, enabled: boolean) => void;
}

interface ExposureLayerListItemTextProps {
    readonly layer: Feature;
}

function ExposureLayerListItemText({ layer }: ExposureLayerListItemTextProps) {
    const name = layer.properties?.name || 'Unnamed Layer';
    return (
        <ListItemText
            primary={name}
            primaryTypographyProps={{
                variant: 'body2',
            }}
        />
    );
}

interface ExposureLayerListProps {
    readonly layers: Feature[];
    readonly selectedExposureLayerIds: Record<string, boolean>;
    readonly onToggle: (layerId: string) => void;
}

function ExposureLayerList({ layers, selectedExposureLayerIds, onToggle }: ExposureLayerListProps) {
    return (
        <Box sx={{ pl: 2, pr: 1, pb: 1 }}>
            {layers.map((layer) => {
                const featureId = layer.id || layer.properties?.id;
                const layerId = featureId !== null && featureId !== undefined ? String(featureId) : null;
                if (!layerId) {
                    return null;
                }
                const isSelected = selectedExposureLayerIds[layerId] || false;
                const name = layer.properties?.name || 'Unnamed Layer';
                return (
                    <ListItem
                        key={layerId}
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            px: 0,
                            py: 0.5,
                        }}
                    >
                        <ExposureLayerListItemText layer={layer} />
                        <ToggleSwitch checked={isSelected} onChange={() => onToggle(layerId)} inputProps={{ 'aria-label': `Toggle ${name}` }} />
                    </ListItem>
                );
            })}
        </Box>
    );
}

const ExposureView = ({ onClose, selectedExposureLayerIds: externalSelectedExposureLayerIds = {}, onExposureLayerToggle }: ExposureViewProps) => {
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Floods']));
    const [localSelectedExposureLayerIds, setLocalSelectedExposureLayerIds] = useState<Record<string, boolean>>({});

    const selectedExposureLayerIds = useMemo(
        () => ({ ...localSelectedExposureLayerIds, ...externalSelectedExposureLayerIds }),
        [localSelectedExposureLayerIds, externalSelectedExposureLayerIds],
    );

    const {
        data: exposureLayersData,
        isLoading: isLoadingLayers,
        isError: isErrorLayers,
    } = useQuery({
        queryKey: ['exposureLayers'],
        queryFn: fetchExposureLayers,
        staleTime: 5 * 60 * 1000,
    });

    const toggleGroup = useCallback((groupName: string) => {
        setExpandedGroups((prev) => {
            const next = new Set(prev);
            next.has(groupName) ? next.delete(groupName) : next.add(groupName);
            return next;
        });
    }, []);

    const toggleExposureLayer = useCallback(
        (layerId: string) => {
            const newState = !selectedExposureLayerIds[layerId];
            setLocalSelectedExposureLayerIds((prev) => {
                const updated = {
                    ...prev,
                    [layerId]: newState,
                };
                return updated;
            });
            onExposureLayerToggle?.(layerId, newState);
        },
        [selectedExposureLayerIds, onExposureLayerToggle],
    );

    const groupedLayers = useMemo(() => {
        if (!exposureLayersData) {
            return {};
        }

        const groups: Record<string, Feature[]> = {};

        exposureLayersData.features.forEach((feature) => {
            const groupName = 'Floods';
            if (!groups[groupName]) {
                groups[groupName] = [];
            }
            groups[groupName].push(feature);
        });

        Object.keys(groups).forEach((groupName) => {
            groups[groupName].sort((a, b) => {
                const nameA = a.properties?.name || '';
                const nameB = b.properties?.name || '';
                return nameA.localeCompare(nameB);
            });
        });

        return groups;
    }, [exposureLayersData]);

    if (isErrorLayers) {
        return (
            <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" fontWeight={600}>
                        Exposure layers
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
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6" fontWeight={600}>
                    Exposure layers
                </Typography>
                <IconButton size="small" onClick={onClose} aria-label="Close panel">
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
                {isLoadingLayers && (
                    <Box sx={{ p: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Loading exposure layers...
                        </Typography>
                    </Box>
                )}

                {!isLoadingLayers && Object.keys(groupedLayers).length === 0 && (
                    <Box sx={{ p: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            No exposure layers found
                        </Typography>
                    </Box>
                )}

                {Object.entries(groupedLayers).map(([groupName, layers]) => {
                    const isGroupExpanded = expandedGroups.has(groupName);

                    return (
                        <Box key={groupName} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Box
                                onClick={() => toggleGroup(groupName)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        toggleGroup(groupName);
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
                                    {groupName} ({layers.length})
                                </Typography>
                                <IconButton size="small">{isGroupExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
                            </Box>

                            <Collapse in={isGroupExpanded}>
                                <ExposureLayerList layers={layers} selectedExposureLayerIds={selectedExposureLayerIds} onToggle={toggleExposureLayer} />
                            </Collapse>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
};

export default ExposureView;
