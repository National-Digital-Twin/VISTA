// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import InfoIcon from '@mui/icons-material/Info';
import { Box, Typography, Chip, Tooltip } from '@mui/material';
import { useMemo } from 'react';
import type { AssetScore as AssetScoreType } from '@/api/asset-scores';

type AssetScoreProps = {
    score: AssetScoreType;
};

type ScoreCategory = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';

const SCORE_CATEGORIES: { [key in ScoreCategory]: { outline: string; fill: string } } = {
    CRITICAL: { outline: '#EB2626', fill: '#F69D9D' },
    HIGH: { outline: '#EB7226', fill: '#F6C59D' },
    MODERATE: { outline: '#F3C300', fill: '#F7EDC4' },
    LOW: { outline: '#369A17', fill: '#A4F69D' },
};

const getScoreCategory = (totalScore: number): ScoreCategory => {
    if (totalScore >= 10) {
        return 'CRITICAL';
    }
    if (totalScore >= 7) {
        return 'HIGH';
    }
    if (totalScore >= 4) {
        return 'MODERATE';
    }
    return 'LOW';
};

const SEGMENT_INDICES = Array.from({ length: 12 }, (_, index) => index);

const ScoreBar = ({ score, maxScore, category }: { score: number; maxScore: number; category: ScoreCategory }) => {
    const filledSegments = Math.round((score / maxScore) * SEGMENT_INDICES.length);
    const categoryColors = SCORE_CATEGORIES[category];

    return (
        <Box sx={{ display: 'flex', mt: 1 }}>
            {SEGMENT_INDICES.map((segment) => (
                <Box
                    key={`score-segment-${segment}`}
                    sx={{
                        flex: 1,
                        height: '16px',
                        backgroundColor: segment < filledSegments ? categoryColors.fill : 'rgba(0, 0, 0, 0.1)',
                        border: `1px solid ${categoryColors.outline}`,
                    }}
                />
            ))}
        </Box>
    );
};

const ScoreBreakdown = ({ score }: { score: AssetScoreType }) => {
    const criticality = Number.parseFloat(score.criticalityScore) || 0;
    const dependency = Number.parseFloat(score.dependencyScore) || 0;
    const exposure = Number.parseFloat(score.exposureScore) || 0;
    const redundancy = Number.parseFloat(score.redundancyScore) || 0;

    const breakdownItems = [
        { label: 'Criticality', value: criticality, range: '0-3' },
        { label: 'Dependency', value: dependency, range: '0-3' },
        { label: 'Exposure', value: exposure, range: '0-3' },
        { label: 'Redundancy', value: redundancy, range: '0-3' },
    ];

    return (
        <Box sx={{ mt: 2 }}>
            {breakdownItems.map((item) => (
                <Box key={item.label} sx={{ mb: 2.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.75 }}>
                        {item.label} ({item.range})
                    </Typography>
                    <Box sx={{ pl: 1.5 }}>
                        <Typography variant="body2">Score: {item.value.toFixed(0)}</Typography>
                    </Box>
                </Box>
            ))}
        </Box>
    );
};

const AssetScore = ({ score }: AssetScoreProps) => {
    const totalScore = useMemo(() => {
        const criticality = Number.parseFloat(score.criticalityScore) || 0;
        const dependency = Number.parseFloat(score.dependencyScore) || 0;
        const exposure = Number.parseFloat(score.exposureScore) || 0;
        const redundancy = Number.parseFloat(score.redundancyScore) || 0;
        return criticality + dependency + exposure + redundancy;
    }, [score]);

    const maxScore = 12;
    const category = getScoreCategory(totalScore);
    const categoryColors = SCORE_CATEGORIES[category];

    return (
        <Box sx={{ px: 2, py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    VISTA score: {totalScore.toFixed(1)}/{maxScore}
                </Typography>
                <Tooltip title="VISTA score breakdown">
                    <InfoIcon sx={{ fontSize: '18px', color: 'text.secondary' }} />
                </Tooltip>
                <Chip
                    label={category}
                    size="small"
                    sx={{
                        backgroundColor: categoryColors.fill,
                        border: `1px solid ${categoryColors.outline}`,
                        color: 'text.primary',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        borderRadius: '4px',
                        ml: 'auto',
                    }}
                />
            </Box>
            <ScoreBar score={totalScore} maxScore={maxScore} category={category} />
            <ScoreBreakdown score={score} />
        </Box>
    );
};

export default AssetScore;
