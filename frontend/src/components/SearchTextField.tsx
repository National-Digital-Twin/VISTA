// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { TextField, InputAdornment, IconButton } from '@mui/material';

type SearchTextFieldProps = {
    readonly placeholder: string;
    readonly value: string;
    readonly onChange: (value: string) => void;
    readonly minWidth?: number;
    readonly fullWidth?: boolean;
    readonly size?: 'small' | 'medium';
};

export function SearchTextField({ placeholder, value, onChange, minWidth = 300, fullWidth = false, size = 'medium' }: SearchTextFieldProps) {
    return (
        <TextField
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            fullWidth={fullWidth}
            size={size}
            sx={{
                'minWidth': fullWidth ? undefined : minWidth,
                '& .MuiOutlinedInput-root': {
                    'backgroundColor': 'neutral.main',
                    'borderRadius': '24px',
                    'paddingLeft': '8px',
                    'paddingRight': '8px',
                    '& fieldset': {
                        border: 'none',
                    },
                    '&:hover fieldset': {
                        border: 'none',
                    },
                    '&.Mui-focused fieldset': {
                        border: 'none',
                    },
                },
            }}
            slotProps={{
                input: {
                    endAdornment: (
                        <InputAdornment position="end" sx={{ paddingRight: '8px' }}>
                            {value ? (
                                <IconButton size="small" onClick={() => onChange('')} aria-label="Clear search">
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            ) : (
                                <SearchIcon />
                            )}
                        </InputAdornment>
                    ),
                },
            }}
        />
    );
}
