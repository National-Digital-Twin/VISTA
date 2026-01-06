import { TextField, InputAdornment, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';

type SearchTextFieldProps = {
    readonly placeholder: string;
    readonly value: string;
    readonly onChange: (value: string) => void;
    readonly minWidth?: number;
    readonly fullWidth?: boolean;
};

export function SearchTextField({ placeholder, value, onChange, minWidth = 300, fullWidth = false }: SearchTextFieldProps) {
    return (
        <TextField
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            fullWidth={fullWidth}
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
