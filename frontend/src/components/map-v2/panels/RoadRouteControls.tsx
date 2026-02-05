import React, { useMemo } from 'react';
import { Box, Typography, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { DeleteOutlined } from '@mui/icons-material';

import { useRouteContext } from '../context/RouteContext';
import { ROUTE_START_COLOR, ROUTE_END_COLOR } from '../constants';
import type { RoadRouteInputParams, RouteEndpoint } from '@/api/utilities';
import IconToggle from '@/components/IconToggle';

const formatMinutes = (minutes: number) => `${minutes} min${minutes === 1 ? '' : 's'}`;

const formatHoursMinutes = (hours: number, minutes: number) => {
    const hourLabel = `${hours} hr${hours === 1 ? '' : 's'}`;
    const minuteLabel = `${minutes} min${minutes === 1 ? '' : 's'}`;
    return `${hourLabel} ${minuteLabel}`;
};

const WALKING_SPEED_FPS = 4.4; // ~3 mph in feet per second

const formatWalkTime = (seconds: number): string => {
    if (seconds < 60) {
        return `${seconds} sec${seconds === 1 ? '' : 's'}`;
    }
    const mins = Math.round(seconds / 60);
    return `${mins} min${mins === 1 ? '' : 's'}`;
};

const formatWalkingSummary = (endpoint: RouteEndpoint, isStart: boolean): string | null => {
    if (endpoint.snapDistanceFeet < 3) {
        return null;
    }
    const distFt = Math.round(endpoint.snapDistanceFeet);
    const walkSeconds = Math.round(endpoint.snapDistanceFeet / WALKING_SPEED_FPS);
    const preposition = isStart ? 'to' : 'from';
    return `Walk ${distFt}ft ${preposition} ${endpoint.name} ~ ${formatWalkTime(walkSeconds)}.`;
};

const RoadRouteControls = React.memo(() => {
    const route = useRouteContext();
    const { start, end, vehicle, isLoading: loading, error, routeData } = route;

    const routeSummary = useMemo(() => {
        const props = routeData?.properties;
        if (!props?.hasRoute) {
            return null;
        }

        const timeMinutes = Math.round(props.durationMinutes);
        const timeHours = Math.floor(timeMinutes / 60);
        const remainingMinutes = timeMinutes % 60;

        return {
            distanceMiles: props.distanceMiles,
            timeMinutes,
            timeHours,
            remainingMinutes,
            averageSpeedMph: props.averageSpeedMph,
            startName: props.start.name,
            endName: props.end.name,
            start: props.start,
            end: props.end,
        };
    }, [routeData]);

    const hasNoRoute = routeData?.properties?.hasRoute === false;

    return (
        <Box sx={{ px: 3, pb: 2 }}>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel id="vehicle-type-label">Vehicle type</InputLabel>
                <Select
                    labelId="vehicle-type-label"
                    value={vehicle || 'Car'}
                    label="Vehicle type"
                    onChange={(e) => route.setVehicle(e.target.value as RoadRouteInputParams['vehicle'])}
                >
                    <MenuItem value="Car">Cars</MenuItem>
                    <MenuItem value="HGV">HGVs</MenuItem>
                    <MenuItem value="EmergencyVehicle">Emergency vehicles</MenuItem>
                </Select>
            </FormControl>

            <Button
                variant="outlined"
                fullWidth
                onClick={() => route.setPositionSelectionMode('start')}
                color={start ? 'success' : 'primary'}
                sx={{ 'textTransform': 'uppercase', 'mb': 1, '& .MuiButton-endIcon': { position: 'absolute', right: 12 } }}
                endIcon={
                    start ? (
                        <DeleteOutlined
                            fontSize="small"
                            color="action"
                            aria-label="Clear start position"
                            onClick={(e) => {
                                e.stopPropagation();
                                route.setStart(null);
                            }}
                        />
                    ) : undefined
                }
            >
                {start ? `START: ${start.lat.toFixed(4)}, ${start.lng.toFixed(4)}` : 'Select Start Position'}
            </Button>

            <Button
                variant="outlined"
                fullWidth
                onClick={() => route.setPositionSelectionMode('end')}
                color={end ? 'error' : 'primary'}
                sx={{ 'textTransform': 'uppercase', 'mb': 2, '& .MuiButton-endIcon': { position: 'absolute', right: 12 } }}
                endIcon={
                    end ? (
                        <DeleteOutlined
                            color="action"
                            fontSize="small"
                            aria-label="Clear end position"
                            onClick={(e) => {
                                e.stopPropagation();
                                route.setEnd(null);
                            }}
                        />
                    ) : undefined
                }
            >
                {end ? `END: ${end.lat.toFixed(4)}, ${end.lng.toFixed(4)}` : 'Select End Location'}
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

            {start && end && !loading && !error && hasNoRoute && (
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
                    {routeSummary.startName && (
                        <Typography variant="body2" color="text.secondary">
                            Start: {routeSummary.startName}
                        </Typography>
                    )}
                    {routeSummary.endName && (
                        <Typography variant="body2" color="text.secondary">
                            End: {routeSummary.endName}
                        </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                        Distance: {routeSummary.distanceMiles.toFixed(2)} miles
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
                    {(routeSummary.start && formatWalkingSummary(routeSummary.start, true)) ||
                    (routeSummary.end && formatWalkingSummary(routeSummary.end, false)) ? (
                        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography variant="body2" fontWeight={500}>
                                    Additional Route Summary
                                </Typography>
                                <IconToggle
                                    checked={route.showAdditionalSummary}
                                    onChange={() => route.setShowAdditionalSummary(!route.showAdditionalSummary)}
                                    aria-label={route.showAdditionalSummary ? 'Hide additional route summary' : 'Show additional route summary'}
                                    size="small"
                                />
                            </Box>
                            {route.showAdditionalSummary && (
                                <Box sx={{ mt: 0.5 }}>
                                    {(
                                        [
                                            { endpoint: routeSummary.start, isStart: true, color: ROUTE_START_COLOR, label: 'S' },
                                            { endpoint: routeSummary.end, isStart: false, color: ROUTE_END_COLOR, label: 'E' },
                                        ] as const
                                    ).map(({ endpoint, isStart, color, label }) => {
                                        const summary = endpoint && formatWalkingSummary(endpoint, isStart);
                                        if (!summary) {
                                            return null;
                                        }
                                        return (
                                            <Box key={label} sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: isStart ? 0.5 : 0 }}>
                                                <Box
                                                    sx={{
                                                        width: 18,
                                                        height: 18,
                                                        borderRadius: '50%',
                                                        backgroundColor: color,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        fontSize: '10px',
                                                        fontWeight: 'bold',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {label}
                                                </Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    : {summary}
                                                </Typography>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            )}
                        </Box>
                    ) : null}
                    <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="body2" fontWeight={500}>
                                Show Direct Line
                            </Typography>
                            <IconToggle
                                checked={route.showDirectLine}
                                onChange={() => route.setShowDirectLine(!route.showDirectLine)}
                                aria-label={route.showDirectLine ? 'Hide direct line' : 'Show direct line'}
                                size="small"
                            />
                        </Box>
                    </Box>
                </Box>
            )}

            <Button variant="contained" fullWidth onClick={route.findRoute} disabled={!start || !end || loading} startIcon={<SearchIcon />} sx={{ mt: 2 }}>
                FIND ROUTE
            </Button>
        </Box>
    );
});

RoadRouteControls.displayName = 'RoadRouteControls';

export default RoadRouteControls;
