import { Box, LinearProgress, Typography } from '@mui/material';
import { getStockColor } from '@/utils/stockLevels';
import { percentage } from '@/utils';

type ResourceTooltipProps = {
    name: string;
    typeName: string;
    currentStock: number;
    maxCapacity: number;
    unit: string;
};

const ResourceTooltip = ({ name, typeName, currentStock, maxCapacity, unit }: ResourceTooltipProps) => (
    <Box
        sx={{
            bgcolor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            p: 1,
            borderRadius: 1,
            minWidth: '240px',
            maxWidth: '300px',
            textAlign: 'center',
        }}
    >
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            {name}
        </Typography>
        <Typography variant="caption" sx={{ textTransform: 'uppercase', opacity: 0.9, display: 'block', mb: 0.5 }}>
            {typeName}
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.9, display: 'block', mb: 0.5 }}>
            {currentStock} / {maxCapacity} {unit}
        </Typography>
        <LinearProgress
            variant="determinate"
            value={percentage(currentStock, maxCapacity)}
            sx={{
                'height': 6,
                'borderRadius': 3,
                'bgcolor': 'rgba(255, 255, 255, 0.2)',
                '& .MuiLinearProgress-bar': { backgroundColor: getStockColor(currentStock, maxCapacity) },
            }}
        />
    </Box>
);

export default ResourceTooltip;
