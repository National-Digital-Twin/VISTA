import { FormControl, FormControlLabel, Paper, Radio, RadioGroup, Stack, Typography } from '@mui/material';
import { forwardRef, type ChangeEvent } from 'react';
import type { MapStyleKey } from '../../constants';
import { MAP_STYLE_OPTIONS } from '../../constants';

interface MapStylePanelProps {
    readonly currentStyle: MapStyleKey;
    readonly onStyleChange: (style: MapStyleKey) => void;
    readonly isOpen: boolean;
    readonly onToggle: () => void;
}

const MapStylePanel = forwardRef<HTMLDivElement, MapStylePanelProps>(({ currentStyle, onStyleChange, isOpen, onToggle }, ref) => {
    const handleStyleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const newStyle = event.target.value as MapStyleKey;
        if (newStyle !== currentStyle) {
            onStyleChange(newStyle);
        }
        onToggle();
    };

    if (!isOpen) {
        return null;
    }

    return (
        <Paper
            ref={ref}
            elevation={4}
            sx={{
                p: 2,
                minWidth: 220,
            }}
        >
            <Stack spacing={1}>
                <Typography variant="subtitle1" fontWeight={600}>
                    Map styles
                </Typography>
                <FormControl component="fieldset" fullWidth>
                    <RadioGroup value={currentStyle} onChange={handleStyleChange}>
                        {MAP_STYLE_OPTIONS.map((style) => (
                            <FormControlLabel key={style.key} value={style.key} control={<Radio />} label={style.name} />
                        ))}
                    </RadioGroup>
                </FormControl>
            </Stack>
        </Paper>
    );
});

MapStylePanel.displayName = 'MapStylePanel';

export default MapStylePanel;
