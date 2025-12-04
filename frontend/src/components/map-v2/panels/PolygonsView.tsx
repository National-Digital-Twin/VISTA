import { Box, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

type PolygonsViewProps = {
    onClose: () => void;
};

const PolygonsView = ({ onClose }: PolygonsViewProps) => {
    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                    Polygons
                </Typography>
                <IconButton size="small" onClick={onClose} aria-label="Close panel">
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>
            <Typography variant="body2" color="text.secondary">
                Polygon information - coming soon
            </Typography>
        </Box>
    );
};

export default PolygonsView;
