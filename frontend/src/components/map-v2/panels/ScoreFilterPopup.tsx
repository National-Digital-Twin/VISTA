// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Button, Dialog, DialogActions, DialogContent, Typography } from '@mui/material';
import { useCallback } from 'react';
import { useScoreFilterState } from '../hooks/useScoreFilterState';
import { ScoreFilterCheckboxGroup, DependencyRangeFields } from './ScoreFilterFields';
import type { ScoreFilterValues } from '@/api/asset-score-filters';

type ScoreFilterPopupProps = {
    readonly open: boolean;
    readonly onClose: () => void;
    readonly onApply: (filter: ScoreFilterValues) => void;
    readonly assetTypeName: string;
    readonly initialValues?: ScoreFilterValues;
};

export function ScoreFilterPopup({ open, onClose, onApply, assetTypeName, initialValues }: ScoreFilterPopupProps) {
    const {
        criticalityValues,
        setCriticalityValues,
        exposureValues,
        setExposureValues,
        redundancyValues,
        setRedundancyValues,
        dependencyMin,
        setDependencyMin,
        dependencyMax,
        setDependencyMax,
        handleCheckboxChange,
        buildFilterPayload,
        isValidRange,
    } = useScoreFilterState({ initialValues });

    const handleApply = useCallback(() => {
        onApply(buildFilterPayload());
    }, [buildFilterPayload, onApply]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={false}
            slotProps={{
                paper: {
                    sx: {
                        position: 'absolute',
                        left: 85,
                        top: 328,
                        m: 0,
                        width: 410,
                    },
                },
            }}
        >
            <DialogContent sx={{ pt: 3, px: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                    {assetTypeName}:
                </Typography>

                <ScoreFilterCheckboxGroup label="Criticality" values={criticalityValues} onChange={handleCheckboxChange} setter={setCriticalityValues} />

                <DependencyRangeFields
                    dependencyMin={dependencyMin}
                    dependencyMax={dependencyMax}
                    onMinChange={setDependencyMin}
                    onMaxChange={setDependencyMax}
                />

                <ScoreFilterCheckboxGroup label="Exposure" values={exposureValues} onChange={handleCheckboxChange} setter={setExposureValues} />
                <ScoreFilterCheckboxGroup label="Redundancy" values={redundancyValues} onChange={handleCheckboxChange} setter={setRedundancyValues} />
            </DialogContent>

            <DialogActions
                sx={{
                    justifyContent: 'flex-end',
                    gap: 1.5,
                    px: 3,
                    pb: 2.5,
                    pt: 1,
                }}
            >
                <Button onClick={onClose} variant="outlined" size="small" sx={{ minWidth: 96 }}>
                    Cancel
                </Button>
                <Button onClick={handleApply} variant="contained" size="small" sx={{ minWidth: 96 }} disabled={!isValidRange()}>
                    Apply
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ScoreFilterPopup;
