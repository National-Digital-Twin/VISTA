// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { LayersClearOutlined } from '@mui/icons-material';
import { Box, Button, IconButton } from '@mui/material';
import { useCallback } from 'react';
import { useScoreFilterState } from '../hooks/useScoreFilterState';
import { ScoreFilterCheckboxGroup, DependencyRangeFields } from './ScoreFilterFields';
import type { ScoreFilterValues } from '@/api/asset-score-filters';

type GlobalScoreFilterProps = {
    readonly onApply: (filter: ScoreFilterValues) => void;
    readonly initialValues?: ScoreFilterValues;
    readonly disabled?: boolean;
};

export function GlobalScoreFilter({ onApply, initialValues, disabled }: GlobalScoreFilterProps) {
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
        resetToDefaults,
        isValidRange,
    } = useScoreFilterState({ initialValues });

    const handleApply = useCallback(() => {
        onApply(buildFilterPayload());
    }, [buildFilterPayload, onApply]);

    const handleClear = useCallback(() => {
        resetToDefaults();
    }, [resetToDefaults]);

    return (
        <Box sx={{ p: 2 }}>
            <ScoreFilterCheckboxGroup
                label="Criticality"
                values={criticalityValues}
                onChange={handleCheckboxChange}
                setter={setCriticalityValues}
                disabled={disabled}
            />

            <DependencyRangeFields
                dependencyMin={dependencyMin}
                dependencyMax={dependencyMax}
                onMinChange={setDependencyMin}
                onMaxChange={setDependencyMax}
                disabled={disabled}
            />

            <ScoreFilterCheckboxGroup label="Exposure" values={exposureValues} onChange={handleCheckboxChange} setter={setExposureValues} disabled={disabled} />
            <ScoreFilterCheckboxGroup
                label="Redundancy"
                values={redundancyValues}
                onChange={handleCheckboxChange}
                setter={setRedundancyValues}
                disabled={disabled}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 2 }}>
                <IconButton size="small" onClick={handleClear} disabled={disabled} title="Clear filter">
                    <LayersClearOutlined fontSize="small" />
                </IconButton>
                <Button variant="contained" size="small" onClick={handleApply} disabled={disabled || !isValidRange()}>
                    Apply
                </Button>
            </Box>
        </Box>
    );
}

export default GlobalScoreFilter;
