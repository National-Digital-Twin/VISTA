import { Box, Paper, Stack, Typography } from '@mui/material';
import { forwardRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAllLiveStations } from '@/api/hydrology';

interface FloodWarningsPanelProps {
    readonly open: boolean;
}

interface FloodStation {
    readonly properties: {
        readonly name?: string;
        readonly atrisk?: boolean;
        readonly value?: number | null;
        readonly trend?: string;
        readonly percentile_5?: number | null;
        readonly percentile_95?: number | null;
        readonly river?: string;
        readonly river_name?: string;
        readonly value_date?: string;
        readonly direction?: string;
    };
}

const FloodWarningsPanel = forwardRef<HTMLDivElement, FloodWarningsPanelProps>(({ open }, ref) => {
    const { data: floodWarnings } = useQuery({
        queryKey: ['floodWarnings'],
        queryFn: async () => {
            const geoJsonData = await fetchAllLiveStations();
            return geoJsonData.features as FloodStation[];
        },
    });

    const atRiskAreas = useMemo(() => {
        if (!floodWarnings || floodWarnings.length === 0) {
            return [];
        }
        return floodWarnings.filter((station) => station.properties.atrisk === true);
    }, [floodWarnings]);

    if (!open) {
        return null;
    }

    return (
        <Paper
            ref={ref}
            elevation={4}
            sx={{
                p: 2,
                minWidth: 350,
                maxWidth: 500,
                maxHeight: '60vh',
                overflowY: 'auto',
            }}
        >
            <Stack spacing={2}>
                <Typography variant="subtitle1" fontWeight={600}>
                    Flood Warnings
                </Typography>
                {atRiskAreas.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                        No current flood warnings
                    </Typography>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        Active flood warnings: {atRiskAreas.length}
                    </Typography>
                )}
                {atRiskAreas.map((area, index) => {
                    const { name, value: currentLevel, trend, percentile_5, percentile_95, river, value_date, direction, river_name } = area.properties;

                    return (
                        <Box key={`${name}-${index}`}>
                            <Stack spacing={0.5}>
                                <Typography variant="body2" fontWeight={600}>
                                    {name || 'Unnamed Area'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" fontSize="0.875rem">
                                    River: {river || river_name || 'Unknown'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" fontSize="0.875rem">
                                    Current Level: {currentLevel === null || currentLevel === undefined ? 'Unknown' : currentLevel.toFixed(2)}m
                                </Typography>
                                <Typography variant="body2" color="text.secondary" fontSize="0.875rem">
                                    Trend: {trend || 'Unknown'} ({direction === 'u' ? 'Upstream' : direction === 'd' ? 'Downstream' : 'Unknown'})
                                </Typography>
                                {value_date && (
                                    <Typography variant="body2" color="text.secondary" fontSize="0.875rem">
                                        Last updated: {new Date(value_date).toLocaleString('en-GB', { hour12: true })}
                                    </Typography>
                                )}
                                {(percentile_5 !== null || percentile_95 !== null) && (
                                    <Typography variant="body2" color="text.secondary" fontSize="0.875rem">
                                        Normal range: {percentile_95 === null || percentile_95 === undefined ? 'Unknown' : percentile_95.toFixed(2)} -{' '}
                                        {percentile_5 === null || percentile_5 === undefined ? 'Unknown' : percentile_5.toFixed(2)}m
                                    </Typography>
                                )}
                            </Stack>
                        </Box>
                    );
                })}
            </Stack>
        </Paper>
    );
});

FloodWarningsPanel.displayName = 'FloodWarningsPanel';

export default FloodWarningsPanel;
