// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import { IconButton, useTheme } from '@mui/material';
import React from 'react';

export type VisibilityState = 'visible' | 'hidden' | 'partial';

export type IconToggleProps = {
    'checked'?: boolean;
    'state'?: VisibilityState;
    'onChange': (event: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>) => void;
    'disabled'?: boolean;
    'aria-label'?: string;
    'aria-labelledby'?: string;
    'size'?: 'small' | 'medium' | 'large';
};

const IconToggle = ({
    checked,
    state,
    onChange,
    disabled = false,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    size = 'medium',
}: IconToggleProps) => {
    const theme = useTheme();

    const visibilityState: VisibilityState = state ?? (checked ? 'visible' : 'hidden');

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (!disabled) {
            onChange(event);
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            onChange(event);
        }
    };

    const renderIcon = () => {
        switch (visibilityState) {
            case 'visible':
                return <VisibilityIcon fontSize={size} data-testid="VisibilityIcon" sx={{ color: theme.palette.primary.main }} />;
            case 'partial':
                return <VisibilityOutlined fontSize={size} data-testid="VisibilityOutlinedIcon" sx={{ color: theme.palette.primary.main }} />;
            case 'hidden':
            default:
                return <VisibilityOffIcon fontSize={size} data-testid="VisibilityOffIcon" />;
        }
    };

    return (
        <IconButton
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            size={size}
            sx={{
                'marginX': 1,
                'padding': 0.5,
                '&:hover': {
                    backgroundColor: 'action.hover',
                },
            }}
        >
            {renderIcon()}
        </IconButton>
    );
};

export default IconToggle;
