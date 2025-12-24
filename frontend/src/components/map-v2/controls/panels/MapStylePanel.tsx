import { Divider, FormControl, FormControlLabel, Paper, Radio, RadioGroup, Stack, Typography } from '@mui/material';
import { forwardRef, type ChangeEvent } from 'react';
import type { MapStyleKey } from '../../constants';
import { MAP_STYLE_OPTIONS } from '../../constants';
import ToggleSwitch from '@/components/ToggleSwitch';

type MapStylePanelProps = {
    currentStyle: MapStyleKey;
    onStyleChange: (style: MapStyleKey) => void;
    isOpen: boolean;
    onToggle: () => void;
    showCoordinates: boolean;
    onShowCoordinatesChange: (show: boolean) => void;
    showCpsIcons: boolean;
    onShowCpsIconsChange: (show: boolean) => void;
};

const MapStylePanel = forwardRef<HTMLDivElement, MapStylePanelProps>(
    ({ currentStyle, onStyleChange, isOpen, onToggle, showCoordinates, onShowCoordinatesChange, showCpsIcons, onShowCpsIconsChange }, ref) => {
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
                <Stack spacing={2}>
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
                    <Divider />
                    <Stack spacing={1.5}>
                        <FormControlLabel
                            control={<ToggleSwitch checked={showCoordinates} onChange={(e) => onShowCoordinatesChange(e.target.checked)} />}
                            label="Coordinates"
                            sx={{ '& .MuiFormControlLabel-label': { ml: 1.5 } }}
                        />
                        <FormControlLabel
                            control={<ToggleSwitch checked={showCpsIcons} onChange={(e) => onShowCpsIconsChange(e.target.checked)} />}
                            label="Show CPS icons"
                            sx={{ '& .MuiFormControlLabel-label': { ml: 1.5 } }}
                        />
                    </Stack>
                </Stack>
            </Paper>
        );
    },
);

MapStylePanel.displayName = 'MapStylePanel';

export default MapStylePanel;
