import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface SearchTextFieldProps {
    readonly placeholder: string;
    readonly value: string;
    readonly onChange: (value: string) => void;
    readonly minWidth?: number;
}

export function SearchTextField({ placeholder, value, onChange, minWidth = 300 }: SearchTextFieldProps) {
    return (
        <TextField
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            sx={{
                minWidth,
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
                            <SearchIcon />
                        </InputAdornment>
                    ),
                },
            }}
        />
    );
}
