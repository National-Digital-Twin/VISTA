import { Box, Paper, Stack, Typography } from '@mui/material';
import { forwardRef } from 'react';

const LEGEND_ITEMS: readonly { readonly id: string; readonly label: string; readonly color: string }[] = [
    { id: 'low', label: 'Low', color: '#4CAF50' },
    { id: 'medium', label: 'Medium', color: '#FF9800' },
    { id: 'high', label: 'High', color: '#F44336' },
];

interface LegendPanelProps {
    readonly open: boolean;
}

const LegendPanel = forwardRef<HTMLDivElement, LegendPanelProps>(({ open }, ref) => {
    if (!open) {
        return null;
    }

    return (
        <Paper
            ref={ref}
            elevation={4}
            sx={{
                p: 2,
                minWidth: 220,
            }}
        >
            <Stack spacing={1}>
                <Typography variant="subtitle1" fontWeight={600}>
                    Legend
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Road Criticality
                </Typography>
                {LEGEND_ITEMS.map((item) => (
                    <Stack key={item.id} direction="row" alignItems="center" spacing={1}>
                        <Box sx={{ width: 32, height: 4, bgcolor: item.color, borderRadius: 2 }} data-testid={`legend-${item.id}`} />
                        <Typography variant="body2">{item.label}</Typography>
                    </Stack>
                ))}
            </Stack>
        </Paper>
    );
});

LegendPanel.displayName = 'LegendPanel';

export default LegendPanel;
