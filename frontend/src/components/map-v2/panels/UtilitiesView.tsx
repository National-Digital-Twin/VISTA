import React, { useCallback, useMemo, useState } from 'react';
import { Box, IconButton, Typography, ListItem, ListItemText, Collapse, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useQuery as useReactQuery } from '@tanstack/react-query';
import type { Feature } from 'geojson';

import { fetchUtilities, type RoadRouteInputParams } from '@/api/utilities';
import IconToggle from '@/components/IconToggle';
import ToggleSwitch from '@/components/ToggleSwitch';

type RoadRoutePosition = {
    readonly lat: number;
    readonly lng: number;
} | null;

type UtilitiesViewProps = {
    readonly onClose: () => void;
    readonly selectedUtilityIds?: Record<string, boolean>;
    readonly onUtilityToggle?: (utilityId: string, enabled: boolean) => void;
    readonly roadRouteStart?: RoadRoutePosition;
    readonly roadRouteEnd?: RoadRoutePosition;
    readonly roadRouteVehicle?: RoadRouteInputParams['vehicle'];
    readonly roadRouteLoading?: boolean;
    readonly roadRouteError?: Error | null;
    readonly roadRouteData?: { routeGeojson: { features: Array<{ properties?: { length?: number; travel_time?: number; speed_kph?: number } }> } };
    readonly onRoadRouteVehicleChange?: (vehicle: RoadRouteInputParams['vehicle']) => void;
    readonly onRequestPositionSelection?: (type: 'start' | 'end' | null) => void;
};

type UtilityListItemTextProps = {
    readonly utility: Feature;
};

const UtilityListItemText = React.memo(({ utility }: UtilityListItemTextProps) => {
    const name = (utility.properties?.name as string) || 'Unnamed Utility';
    return (
        <ListItemText
            primary={name}
            primaryTypographyProps={{
                variant: 'body2',
            }}
        />
    );
});

UtilityListItemText.displayName = 'UtilityListItemText';

type UtilityListProps = {
    readonly utilities: Feature[];
    readonly selectedUtilityIds: Record<string, boolean>;
    readonly onToggle: (utilityId: string) => void;
};

type RoadRouteControlsProps = {
    readonly start: RoadRoutePosition | null;
    readonly end: RoadRoutePosition | null;
    readonly vehicle: RoadRouteInputParams['vehicle'];
    readonly loading?: boolean;
    readonly error?: Error | null;
    readonly routeData?: { routeGeojson: { features: Array<{ properties?: { length?: number; travel_time?: number; speed_kph?: number } }> } };
    readonly onStartClick: () => void;
    readonly onEndClick: () => void;
    readonly onVehicleChange: (vehicle: RoadRouteInputParams['vehicle']) => void;
};

const formatMinutes = (minutes: number) => `${minutes} min${minutes === 1 ? '' : 's'}`;

const formatHoursMinutes = (hours: number, minutes: number) => {
    const hourLabel = `${hours} hr${hours === 1 ? '' : 's'}`;
    const minuteLabel = `${minutes} min${minutes === 1 ? '' : 's'}`;
    return `${hourLabel} ${minuteLabel}`;
};

const RoadRouteControls = React.memo(
    ({ start, end, vehicle, loading, error, routeData, onStartClick, onEndClick, onVehicleChange }: RoadRouteControlsProps) => {
        const routeSummary = useMemo(() => {
            if (!routeData?.routeGeojson?.features) {
                return null;
            }

            let totalDistance = 0;
            let totalTime = 0;
            let totalSpeedWeighted = 0;
            let totalLengthForSpeed = 0;

            for (const feature of routeData.routeGeojson.features) {
                const length = feature.properties?.length;
                const travelTime = feature.properties?.travel_time;
                const speedKph = feature.properties?.speed_kph;

                if (typeof length === 'number') {
                    totalDistance += length;
                }
                if (typeof travelTime === 'number') {
                    totalTime += travelTime;
                }
                if (typeof speedKph === 'number' && typeof length === 'number' && length > 0) {
                    totalSpeedWeighted += speedKph * length;
                    totalLengthForSpeed += length;
                }
            }

            if (totalDistance === 0 && totalTime === 0) {
                return null;
            }

            const distanceKm = totalDistance / 1000;
            const timeMinutes = Math.round(totalTime / 60);
            const timeHours = Math.floor(timeMinutes / 60);
            const remainingMinutes = timeMinutes % 60;

            const averageSpeedKph = totalLengthForSpeed > 0 ? totalSpeedWeighted / totalLengthForSpeed : 0;
            const averageSpeedMph = averageSpeedKph * 0.621371;

            return {
                distance: distanceKm,
                timeMinutes,
                timeHours,
                remainingMinutes,
                averageSpeedMph,
            };
        }, [routeData]);

        return (
            <Box sx={{ px: 3, pb: 2 }}>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel id="vehicle-type-label">Vehicle type</InputLabel>
                    <Select
                        labelId="vehicle-type-label"
                        value={vehicle || 'Car'}
                        label="Vehicle type"
                        onChange={(e) => onVehicleChange(e.target.value as RoadRouteInputParams['vehicle'])}
                    >
                        <MenuItem value="Car">Cars</MenuItem>
                        <MenuItem value="HGV">HGVs</MenuItem>
                        <MenuItem value="EmergencyVehicle">Emergency vehicles</MenuItem>
                    </Select>
                </FormControl>

                <Button variant="outlined" fullWidth onClick={onStartClick} sx={{ mb: 1 }} color={start ? 'success' : 'primary'}>
                    {start ? `Start: ${start.lat.toFixed(4)}, ${start.lng.toFixed(4)}` : 'Select Start Position'}
                </Button>

                <Button variant="outlined" fullWidth onClick={onEndClick} color={end ? 'success' : 'primary'} disabled={!start}>
                    {end ? `End: ${end.lat.toFixed(4)}, ${end.lng.toFixed(4)}` : 'Select End Location'}
                </Button>

                {start && end && loading && !error && (
                    <Box sx={{ mt: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary" align="center">
                            Loading route...
                        </Typography>
                    </Box>
                )}

                {start && end && error && (
                    <Box sx={{ mt: 2, p: 1.5, bgcolor: 'error.main', borderRadius: 1 }}>
                        <Typography variant="body2" color="error.contrastText" align="center">
                            Route loading failed. Please try again.
                        </Typography>
                    </Box>
                )}

                {start && end && !loading && !error && routeData?.routeGeojson?.features?.length === 0 && (
                    <Box sx={{ mt: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary" align="center">
                            No route available between these points.
                        </Typography>
                    </Box>
                )}

                {start && end && !loading && !error && routeSummary && (
                    <Box sx={{ mt: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5 }}>
                            Route Summary
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Distance: {(routeSummary.distance * 0.6213712).toFixed(2)} miles
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Time:{' '}
                            {routeSummary.timeHours > 0
                                ? formatHoursMinutes(routeSummary.timeHours, routeSummary.remainingMinutes)
                                : formatMinutes(routeSummary.timeMinutes)}
                        </Typography>
                        {routeSummary.averageSpeedMph > 0 && (
                            <Typography variant="body2" color="text.secondary">
                                Average Speed: {routeSummary.averageSpeedMph.toFixed(1)} mph
                            </Typography>
                        )}
                    </Box>
                )}
            </Box>
        );
    },
);

RoadRouteControls.displayName = 'RoadRouteControls';

const UtilityList = React.memo(({ utilities, selectedUtilityIds, onToggle }: UtilityListProps) => {
    return (
        <Box sx={{ pl: 2, pr: 1, pb: 1 }}>
            {utilities.map((utility) => {
                const featureId = utility.id || utility.properties?.id;
                const utilityId = featureId !== null && featureId !== undefined ? String(featureId) : null;
                if (!utilityId) {
                    return null;
                }
                const isSelected = selectedUtilityIds[utilityId] || false;
                const name = (utility.properties?.name as string) || 'Unnamed Utility';
                const isRoadRoute = utilityId === 'road-route';
                return (
                    <ListItem
                        key={utilityId}
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            px: 1,
                            py: 0.5,
                        }}
                    >
                        <UtilityListItemText utility={utility} />
                        {isRoadRoute ? (
                            <ToggleSwitch checked={isSelected} onChange={() => onToggle(utilityId)} aria-label={isSelected ? `Hide ${name}` : `Show ${name}`} />
                        ) : (
                            <IconToggle
                                checked={isSelected}
                                onChange={() => onToggle(utilityId)}
                                aria-label={isSelected ? `Hide ${name}` : `Show ${name}`}
                                size="small"
                            />
                        )}
                    </ListItem>
                );
            })}
        </Box>
    );
});

UtilityList.displayName = 'UtilityList';

type UtilityGroupProps = {
    readonly groupName: string;
    readonly utilities: Feature[];
    readonly isExpanded: boolean;
    readonly selectedUtilityIds: Record<string, boolean>;
    readonly onToggleGroup: (groupName: string) => void;
    readonly onToggleUtility: (utilityId: string) => void;
    readonly roadRouteStart?: RoadRoutePosition;
    readonly roadRouteEnd?: RoadRoutePosition;
    readonly roadRouteVehicle?: RoadRouteInputParams['vehicle'];
    readonly roadRouteLoading?: boolean;
    readonly roadRouteError?: Error | null;
    readonly roadRouteData?: { routeGeojson: { features: Array<{ properties?: { length?: number; travel_time?: number; speed_kph?: number } }> } };
    readonly onRoadRouteStartClick?: () => void;
    readonly onRoadRouteEndClick?: () => void;
    readonly onRoadRouteVehicleChange?: (vehicle: RoadRouteInputParams['vehicle']) => void;
};

const UtilityGroup = React.memo(
    ({
        groupName,
        utilities,
        isExpanded,
        selectedUtilityIds,
        onToggleGroup,
        onToggleUtility,
        roadRouteStart,
        roadRouteEnd,
        roadRouteVehicle,
        roadRouteLoading,
        roadRouteError,
        roadRouteData,
        onRoadRouteStartClick,
        onRoadRouteEndClick,
        onRoadRouteVehicleChange,
    }: UtilityGroupProps) => {
        const handleToggle = useCallback(
            (e: React.MouseEvent | React.KeyboardEvent) => {
                e.stopPropagation();
                e.preventDefault();
                onToggleGroup(groupName);
            },
            [groupName, onToggleGroup],
        );

        const hasRoadRoute = utilities.some((u) => (u.id || u.properties?.id) === 'road-route');

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
                        {hasRoadRoute && roadRouteStart && roadRouteEnd && ` (1)`}
                    </Typography>
                </Button>

                <Collapse in={isExpanded}>
                    {hasRoadRoute && isExpanded ? (
                        <Box>
                            <UtilityList utilities={utilities} selectedUtilityIds={selectedUtilityIds} onToggle={onToggleUtility} />
                            {selectedUtilityIds['road-route'] &&
                                roadRouteVehicle !== undefined &&
                                onRoadRouteStartClick &&
                                onRoadRouteEndClick &&
                                onRoadRouteVehicleChange && (
                                    <RoadRouteControls
                                        start={roadRouteStart || null}
                                        end={roadRouteEnd || null}
                                        vehicle={roadRouteVehicle}
                                        loading={roadRouteLoading}
                                        error={roadRouteError}
                                        routeData={roadRouteData}
                                        onStartClick={onRoadRouteStartClick}
                                        onEndClick={onRoadRouteEndClick}
                                        onVehicleChange={onRoadRouteVehicleChange}
                                    />
                                )}
                        </Box>
                    ) : (
                        <UtilityList utilities={utilities} selectedUtilityIds={selectedUtilityIds} onToggle={onToggleUtility} />
                    )}
                </Collapse>
            </Box>
        );
    },
);

UtilityGroup.displayName = 'UtilityGroup';

const UtilitiesView = ({
    onClose,
    selectedUtilityIds: externalSelectedUtilityIds = {},
    onUtilityToggle,
    roadRouteStart,
    roadRouteEnd,
    roadRouteVehicle = 'Car',
    roadRouteLoading,
    roadRouteError,
    roadRouteData,
    onRoadRouteVehicleChange,
    onRequestPositionSelection,
}: UtilitiesViewProps) => {
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    const {
        data: utilitiesData,
        isLoading: isLoadingUtilities,
        isError: isErrorUtilities,
    } = useReactQuery({
        queryKey: ['utilities'],
        queryFn: fetchUtilities,
        staleTime: 5 * 60 * 1000,
    });

    const toggleGroup = useCallback((groupName: string) => {
        setExpandedGroups((prev) => {
            const next = new Set(prev);
            next.has(groupName) ? next.delete(groupName) : next.add(groupName);
            return next;
        });
    }, []);

    const toggleUtility = useCallback(
        (utilityId: string) => {
            const currentState = externalSelectedUtilityIds[utilityId] || false;
            onUtilityToggle?.(utilityId, !currentState);
        },
        [externalSelectedUtilityIds, onUtilityToggle],
    );

    const handleStartClick = useCallback(() => {
        onRequestPositionSelection?.('start');
    }, [onRequestPositionSelection]);

    const handleEndClick = useCallback(() => {
        onRequestPositionSelection?.('end');
    }, [onRequestPositionSelection]);

    const groupedUtilities = useMemo(() => {
        if (!utilitiesData) {
            return {};
        }

        const groups: Record<string, { name: string; utilities: Feature[] }> = {};

        for (const group of utilitiesData.groups) {
            const utilities = group.utilities.map((utility) => ({
                type: 'Feature' as const,
                id: utility.id,
                geometry: utility.geometry,
                properties: {
                    name: utility.name,
                    groupId: group.id,
                    groupName: group.name,
                },
            }));

            if (utilities.length > 0) {
                groups[group.id] = {
                    name: group.name,
                    utilities,
                };
            }
        }

        return groups;
    }, [utilitiesData]);

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
                    utilitiesData &&
                    Object.entries(groupedUtilities).map(([groupId, group]) => (
                        <UtilityGroup
                            key={groupId}
                            groupName={group.name}
                            utilities={group.utilities}
                            isExpanded={expandedGroups.has(group.name)}
                            selectedUtilityIds={externalSelectedUtilityIds}
                            onToggleGroup={toggleGroup}
                            onToggleUtility={toggleUtility}
                            roadRouteStart={roadRouteStart}
                            roadRouteEnd={roadRouteEnd}
                            roadRouteVehicle={roadRouteVehicle}
                            roadRouteLoading={roadRouteLoading}
                            roadRouteError={roadRouteError}
                            roadRouteData={roadRouteData}
                            onRoadRouteStartClick={handleStartClick}
                            onRoadRouteEndClick={handleEndClick}
                            onRoadRouteVehicleChange={onRoadRouteVehicleChange}
                        />
                    ))}
            </Box>
        </Box>
    );
};

export default UtilitiesView;
