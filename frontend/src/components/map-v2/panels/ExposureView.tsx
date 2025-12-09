import React, { useCallback, useMemo, useState } from 'react';
import { Box, IconButton, Typography, ListItem, ListItemText, Collapse, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useQuery } from '@tanstack/react-query';
import type { Feature } from 'geojson';

import { fetchExposureLayers } from '@/api/exposure-layers';
import IconToggle from '@/components/IconToggle';

type ExposureViewProps = {
    onClose: () => void;
    selectedExposureLayerIds?: Record<string, boolean>;
    onExposureLayerToggle?: (layerId: string, enabled: boolean) => void;
};

type ExposureLayerListItemTextProps = {
    layer: Feature;
};

const ExposureLayerListItemText = React.memo(({ layer }: ExposureLayerListItemTextProps) => {
    const name = (layer.properties?.name as string) || 'Unnamed Layer';
    return (
        <ListItemText
            primary={name}
            primaryTypographyProps={{
                variant: 'body2',
            }}
        />
    );
});

ExposureLayerListItemText.displayName = 'ExposureLayerListItemText';

type ExposureLayerListProps = {
    layers: Feature[];
    selectedExposureLayerIds: Record<string, boolean>;
    onToggle: (layerId: string) => void;
};

const ExposureLayerList = React.memo(({ layers, selectedExposureLayerIds, onToggle }: ExposureLayerListProps) => {
    return (
        <Box sx={{ pl: 2, pr: 1, pb: 1 }}>
            {layers.map((layer) => {
                const featureId = layer.id || layer.properties?.id;
                const layerId = featureId !== null && featureId !== undefined ? String(featureId) : null;
                if (!layerId) {
                    return null;
                }
                const isSelected = selectedExposureLayerIds[layerId] || false;
                const name = (layer.properties?.name as string) || 'Unnamed Layer';
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
                        <IconToggle
                            checked={isSelected}
                            onChange={() => onToggle(layerId)}
                            aria-label={isSelected ? `Hide ${name}` : `Show ${name}`}
                            size="small"
                        />
                    </ListItem>
                );
            })}
        </Box>
    );
});

ExposureLayerList.displayName = 'ExposureLayerList';

type ExposureGroupProps = {
    groupName: string;
    layers: Feature[];
    isExpanded: boolean;
    selectedExposureLayerIds: Record<string, boolean>;
    onToggleGroup: (groupName: string) => void;
    onToggleLayer: (layerId: string) => void;
};

const ExposureGroup = React.memo(({ groupName, layers, isExpanded, selectedExposureLayerIds, onToggleGroup, onToggleLayer }: ExposureGroupProps) => {
    const handleToggle = useCallback(
        (e: React.MouseEvent | React.KeyboardEvent) => {
            e.stopPropagation();
            e.preventDefault();
            onToggleGroup(groupName);
        },
        [groupName, onToggleGroup],
    );

    return (
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Button
                onClick={handleToggle}
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
                    aria-label={isExpanded ? 'Collapse' : 'Expand'}
                >
                    {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </Box>
                <Typography variant="body1" sx={{ flexGrow: 1, fontWeight: 500, textAlign: 'left' }}>
                    {groupName}
                </Typography>
            </Button>

            <Collapse in={isExpanded}>
                <ExposureLayerList layers={layers} selectedExposureLayerIds={selectedExposureLayerIds} onToggle={onToggleLayer} />
            </Collapse>
        </Box>
    );
});

ExposureGroup.displayName = 'ExposureGroup';

const ExposureView = ({ onClose, selectedExposureLayerIds: externalSelectedExposureLayerIds = {}, onExposureLayerToggle }: ExposureViewProps) => {
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
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
        if (!exposureLayersData?.groups || !exposureLayersData.featureCollection) {
            return {};
        }

        const groups: Record<string, { name: string; layers: Feature[] }> = {};

        exposureLayersData.featureCollection.features.forEach((feature) => {
            const groupName = feature.properties?.groupName as string | undefined;
            const groupId = feature.properties?.groupId as string | undefined;
            if (!groupName || !groupId) {
                return;
            }
            if (!groups[groupId]) {
                groups[groupId] = { name: groupName, layers: [] };
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

        return groups;
    }, [exposureLayersData]);

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
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6" fontWeight={600}>
                    Exposure
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

                {Object.entries(groupedLayers).map(([groupId, groupData]) => (
                    <ExposureGroup
                        key={groupId}
                        groupName={groupData.name}
                        layers={groupData.layers}
                        isExpanded={expandedGroups.has(groupData.name)}
                        selectedExposureLayerIds={selectedExposureLayerIds}
                        onToggleGroup={toggleGroup}
                        onToggleLayer={toggleExposureLayer}
                    />
                ))}
            </Box>
        </Box>
    );
};

export default ExposureView;
