import React from 'react';
import { IconButton, useTheme } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

export interface IconToggleProps {
    readonly 'checked': boolean;
    readonly 'onChange': (event: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>) => void;
    readonly 'disabled'?: boolean;
    readonly 'aria-label'?: string;
    readonly 'aria-labelledby'?: string;
    readonly 'size'?: 'small' | 'medium' | 'large';
}

const IconToggle = ({ checked, onChange, disabled = false, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, size = 'medium' }: IconToggleProps) => {
    const theme = useTheme();

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
            {checked ? (
                <VisibilityIcon
                    fontSize={size}
                    data-testid="VisibilityIcon"
                    sx={{
                        color: theme.palette.primary.main,
                    }}
                />
            ) : (
                <VisibilityOffIcon fontSize={size} data-testid="VisibilityOffIcon" />
            )}
        </IconButton>
    );
};

export default IconToggle;
