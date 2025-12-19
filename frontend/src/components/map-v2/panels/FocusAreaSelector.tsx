import { useCallback } from 'react';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { fetchFocusAreas, type FocusArea } from '@/api/focus-areas';

type FocusAreaSelectorProps = {
    readonly scenarioId: string | undefined;
    readonly selectedFocusAreaId: string | null;
    readonly onFocusAreaSelect: (focusAreaId: string | null) => void;
    readonly label?: string;
    readonly disabled?: boolean;
};

const FocusAreaSelector = ({ scenarioId, selectedFocusAreaId, onFocusAreaSelect, label = 'Select focus area', disabled }: FocusAreaSelectorProps) => {
    const { data: focusAreas, isLoading } = useQuery({
        queryKey: ['focusAreas', scenarioId],
        queryFn: () => fetchFocusAreas(scenarioId!),
        enabled: !!scenarioId,
        staleTime: 5 * 60 * 1000,
    });

    const handleChange = useCallback(
        (event: SelectChangeEvent<string>) => {
            onFocusAreaSelect(event.target.value || null);
        },
        [onFocusAreaSelect],
    );

    const selectValue = focusAreas?.find((fa) => fa.id === selectedFocusAreaId) ? selectedFocusAreaId : '';

    return (
        <FormControl fullWidth size="small">
            <InputLabel id="focus-area-select-label">{label}</InputLabel>
            <Select labelId="focus-area-select-label" value={selectValue ?? ''} onChange={handleChange} label={label} disabled={disabled || isLoading}>
                {focusAreas?.map((fa: FocusArea) => (
                    <MenuItem key={fa.id} value={fa.id}>
                        {fa.name}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};

export default FocusAreaSelector;
