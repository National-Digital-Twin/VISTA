// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Box, Typography } from '@mui/material';
import type { ReactElement } from 'react';

type MapPanelButtonProps = {
    readonly label: string;
    readonly icon: ReactElement;
    readonly isActive: boolean;
    readonly onClick?: () => void;
};

const MapPanelButton = ({ label, icon, isActive, onClick }: MapPanelButtonProps) => {
    const getHoverBgColor = () => {
        if (!onClick) {
            return isActive ? 'chip.main' : 'transparent';
        }
        return isActive ? 'chip.main' : 'action.hover';
    };

    return (
        <Box
            onClick={onClick}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                p: 1.5,
                cursor: onClick ? 'pointer' : 'default',
            }}
        >
            <Box
                sx={{
                    'display': 'flex',
                    'alignItems': 'center',
                    'justifyContent': 'center',
                    'width': '100%',
                    'height': 40,
                    'color': 'text.primary',
                    'flexShrink': 0,
                    'borderRadius': 20,
                    'bgcolor': isActive ? 'chip.main' : 'transparent',
                    'transition': 'background-color 0.2s',
                    '&:hover': {
                        bgcolor: getHoverBgColor(),
                    },
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
