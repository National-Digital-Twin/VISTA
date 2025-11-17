import { Box, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface ExposureViewProps {
    readonly onClose: () => void;
}

const ExposureView = ({ onClose }: ExposureViewProps) => {
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
                Exposure information - coming soon
            </Typography>
        </Box>
    );
};

export default ExposureView;
