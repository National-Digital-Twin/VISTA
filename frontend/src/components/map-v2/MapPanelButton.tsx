import { Box, Typography } from '@mui/material';
import type { ReactElement } from 'react';

interface MapPanelButtonProps {
    readonly label: string;
    readonly icon: ReactElement;
    readonly isActive: boolean;
    readonly onClick?: () => void;
}

const MapPanelButton = ({ label, icon, isActive, onClick }: MapPanelButtonProps) => {
    return (
        <Box
            onClick={onClick}
            sx={{
                'display': 'flex',
                'flexDirection': 'column',
                'alignItems': 'center',
                'p': 1.5,
                'cursor': onClick ? 'pointer' : 'default',
                'bgcolor': isActive ? 'chip.main' : 'transparent',
                '&:hover': {
                    bgcolor: onClick ? (isActive ? 'chip.main' : 'action.hover') : isActive ? 'chip.main' : 'transparent',
                },
                'transition': 'background-color 0.2s',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 40,
                    height: 40,
                    color: 'text.primary',
                    flexShrink: 0,
                }}
            >
                {icon}
            </Box>
            <Typography
                variant="caption"
                fontWeight={400}
                color="text.primary"
                sx={{
                    mt: 0.5,
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    lineHeight: 1.2,
                }}
            >
                {label}
            </Typography>
        </Box>
    );
};

export default MapPanelButton;
