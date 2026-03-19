// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import CloseIcon from '@mui/icons-material/Close';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, IconButton, Typography, Collapse, Button } from '@mui/material';
import { useQuery as useReactQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import RoadRouteControls from './RoadRouteControls';
import { fetchUtilities } from '@/api/utilities';

type UtilitiesViewProps = {
    readonly onClose: () => void;
};

const UTILITY_COMPONENTS: Record<string, React.ComponentType> = {
    'road-route': RoadRouteControls,
};

type UtilityGroupSectionProps = {
    readonly groupName: string;
    readonly utilityIds: readonly string[];
    readonly isExpanded: boolean;
    readonly onToggle: () => void;
};

const UtilityGroupSection = React.memo(({ groupName, utilityIds, isExpanded, onToggle }: UtilityGroupSectionProps) => {
    return (
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Button
                onClick={onToggle}
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
                {isExpanded &&
                    utilityIds.map((id) => {
                        const Component = UTILITY_COMPONENTS[id];
                        return Component ? <Component key={id} /> : null;
                    })}
            </Collapse>
        </Box>
    );
});

UtilityGroupSection.displayName = 'UtilityGroupSection';

const UtilitiesView = ({ onClose }: UtilitiesViewProps) => {
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const hasInitialized = useRef(false);

    const {
        data: utilitiesData,
        isLoading: isLoadingUtilities,
        isError: isErrorUtilities,
    } = useReactQuery({
        queryKey: ['utilities'],
        queryFn: fetchUtilities,
        staleTime: 5 * 60 * 1000,
    });

    useEffect(() => {
        if (!utilitiesData || hasInitialized.current) {
            return;
        }
        hasInitialized.current = true;

        const names = utilitiesData.groups.filter((g) => g.utilities.some((u) => u.id in UTILITY_COMPONENTS)).map((g) => g.name);
        if (names.length > 0) {
            setExpandedGroups(new Set(names));
        }
    }, [utilitiesData]);

    const toggleGroup = useCallback((groupName: string) => {
        setExpandedGroups((prev) => {
            const next = new Set(prev);
            next.has(groupName) ? next.delete(groupName) : next.add(groupName);
            return next;
        });
    }, []);

    if (isErrorUtilities) {
        return (
            <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" fontWeight={600}>
                        Utilities
                    </Typography>
                    <IconButton size="small" onClick={onClose} aria-label="Close panel">
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
                <Typography variant="body2" color="text.secondary">
                    Error loading utilities
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6" fontWeight={600}>
                    Utilities
                </Typography>
                <IconButton size="small" onClick={onClose} aria-label="Close panel">
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto' }}>
                {isLoadingUtilities && (
                    <Box sx={{ p: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Loading utilities...
                        </Typography>
                    </Box>
                )}

                {!isLoadingUtilities &&
                    utilitiesData?.groups.map((group) => {
                        const utilityIds = group.utilities.map((u) => u.id).filter((id) => id in UTILITY_COMPONENTS);
                        if (utilityIds.length === 0) {
                            return null;
                        }
                        return (
                            <UtilityGroupSection
                                key={group.id}
                                groupName={group.name}
                                utilityIds={utilityIds}
                                isExpanded={expandedGroups.has(group.name)}
                                onToggle={() => toggleGroup(group.name)}
                            />
                        );
                    })}
            </Box>
        </Box>
    );
};

export default UtilitiesView;
