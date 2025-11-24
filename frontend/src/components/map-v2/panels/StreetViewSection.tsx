import { Box, Alert, Typography } from '@mui/material';
import StreetviewIcon from '@mui/icons-material/Streetview';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

interface StreetViewSectionProps {
    readonly hasCoordinates: boolean;
    readonly streetViewUrl: string | null;
}

const StreetViewSection = ({ hasCoordinates, streetViewUrl }: StreetViewSectionProps) => {
    if (!hasCoordinates || !streetViewUrl) {
        return (
            <Box sx={{ p: 2 }}>
                <Alert severity="info">Coordinates not available for Street View</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 2 }}>
            <Box
                component="a"
                href={streetViewUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                    'position': 'relative',
                    'width': '100%',
                    'height': '140px',
                    'borderRadius': 1,
                    'overflow': 'hidden',
                    'border': '1px solid',
                    'borderColor': 'divider',
                    'display': 'flex',
                    'alignItems': 'center',
                    'justifyContent': 'center',
                    'bgcolor': 'grey.100',
                    'textDecoration': 'none',
                    'cursor': 'pointer',
                    '&:hover': {
                        bgcolor: 'grey.200',
                    },
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1,
                        color: 'text.secondary',
                    }}
                >
                    <StreetviewIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                    <Typography variant="body2" fontWeight={500}>
                        Click to view Street View
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, opacity: 0.8 }}>
                        <OpenInNewIcon sx={{ fontSize: '0.875rem' }} />
                        Opens in new tab
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default StreetViewSection;
