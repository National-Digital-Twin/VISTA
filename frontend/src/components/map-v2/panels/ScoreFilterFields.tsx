import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { useCallback } from 'react';
import { Box, Checkbox, FormControlLabel, FormGroup, FormLabel, TextField, Typography } from '@mui/material';
import { SCORE_VALUES } from '../hooks/useScoreFilterState';

const MIN_DEPENDENCY = 0;
const MAX_DEPENDENCY = 3;

const clampDependencyValue = (value: string): string => {
    if (value === '' || value === '-') {
        return value;
    }
    const num = parseFloat(value);
    if (isNaN(num)) {
        return value;
    }
    if (num < MIN_DEPENDENCY) {
        return String(MIN_DEPENDENCY);
    }
    if (num > MAX_DEPENDENCY) {
        return String(MAX_DEPENDENCY);
    }
    return value;
};

type ScoreFilterCheckboxGroupProps = {
    readonly label: string;
    readonly values: number[];
    readonly onChange: (setter: Dispatch<SetStateAction<number[]>>, value: number, checked: boolean) => void;
    readonly setter: Dispatch<SetStateAction<number[]>>;
    readonly disabled?: boolean;
};

export function ScoreFilterCheckboxGroup({ label, values, onChange, setter, disabled }: ScoreFilterCheckboxGroupProps) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 2 }}>
            <FormLabel component="legend" sx={{ fontWeight: 500, minWidth: 110 }}>
                {label}:
            </FormLabel>
            <FormGroup
                row
                sx={{
                    flex: 1,
                    justifyContent: 'space-between',
                }}
            >
                {SCORE_VALUES.map((v) => (
                    <FormControlLabel
                        key={v}
                        control={
                            <Checkbox checked={values.includes(v)} onChange={(e) => onChange(setter, v, e.target.checked)} size="small" disabled={disabled} />
                        }
                        label={v.toString()}
                        labelPlacement="start"
                        sx={{
                            'm': 0,
                            '.MuiFormControlLabel-label': {
                                mr: 0.25,
                            },
                        }}
                    />
                ))}
            </FormGroup>
        </Box>
    );
}

type DependencyRangeFieldsProps = {
    readonly dependencyMin: string;
    readonly dependencyMax: string;
    readonly onMinChange: (value: string) => void;
    readonly onMaxChange: (value: string) => void;
    readonly disabled?: boolean;
};

export function DependencyRangeFields({ dependencyMin, dependencyMax, onMinChange, onMaxChange, disabled }: DependencyRangeFieldsProps) {
    const handleMinChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            onMinChange(clampDependencyValue(e.target.value));
        },
        [onMinChange],
    );

    const handleMaxChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            onMaxChange(clampDependencyValue(e.target.value));
        },
        [onMaxChange],
    );

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 2 }}>
            <FormLabel component="legend" sx={{ fontWeight: 500, minWidth: 110 }}>
                Dependency:
            </FormLabel>
            <Box
                sx={{
                    display: 'flex',
                    gap: 1.5,
                    alignItems: 'center',
                    flex: 1,
                }}
            >
                <TextField
                    size="small"
                    type="number"
                    slotProps={{ htmlInput: { min: MIN_DEPENDENCY, max: MAX_DEPENDENCY, step: 0.01 } }}
                    value={dependencyMin}
                    onChange={handleMinChange}
                    sx={{ flex: 1, minWidth: 90, maxWidth: 140 }}
                    disabled={disabled}
                />
                <Typography variant="body2">to</Typography>
                <TextField
                    size="small"
                    type="number"
                    slotProps={{ htmlInput: { min: MIN_DEPENDENCY, max: MAX_DEPENDENCY, step: 0.01 } }}
                    value={dependencyMax}
                    onChange={handleMaxChange}
                    sx={{ flex: 1, minWidth: 90, maxWidth: 140 }}
                    disabled={disabled}
                />
            </Box>
        </Box>
    );
}
