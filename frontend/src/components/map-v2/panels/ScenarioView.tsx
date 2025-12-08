import { Box, IconButton, Link, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

type ScenarioViewProps = {
    onItemClick: (itemId: string) => void;
    onClose: () => void;
};

const ScenarioView = ({ onItemClick, onClose }: ScenarioViewProps) => {
    const scenarioName = 'Flood in Newport';

    const linkStyle = {
        mb: 1,
        textAlign: 'left',
        display: 'block',
    };

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                    {scenarioName}
                </Typography>
                <IconButton size="small" onClick={onClose} aria-label="Close panel">
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                    <Link component="button" variant="body1" underline="none" onClick={() => onItemClick('assets')} sx={linkStyle}>
                        Assets
                    </Link>
                    <Typography variant="body2" color="text.secondary">
                        No assets added to the map
                    </Typography>
                </Box>

                <Box>
                    <Link component="button" variant="body1" underline="none" onClick={() => onItemClick('exposure')} sx={linkStyle}>
                        Exposure
                    </Link>
                    <Typography variant="body2" color="text.secondary">
                        No exposure added to the map
                    </Typography>
                </Box>

                <Box>
                    <Link component="button" variant="body1" underline="none" onClick={() => onItemClick('focus-area')} sx={linkStyle}>
                        Focus area
                    </Link>
                    <Typography variant="body2" color="text.secondary">
                        No focus areas added to the map
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default ScenarioView;
