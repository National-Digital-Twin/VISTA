import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, it, expect } from 'vitest';
import AssetScore from './AssetScore';
import type { AssetScore as AssetScoreType } from '@/api/asset-scores';
import theme from '@/theme';

const renderWithTheme = (component: React.ReactElement) => {
    return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('AssetScore', () => {
    const createMockScore = (overrides: Partial<AssetScoreType> = {}): AssetScoreType => ({
        id: 'score-1',
        scenarioId: 'scenario-1',
        criticalityScore: '3.0',
        dependencyScore: '2.5',
        exposureScore: '1.5',
        redundancyScore: '0.5',
        ...overrides,
    });

    describe('rendering', () => {
        it('displays total score correctly', () => {
            const score = createMockScore();
            renderWithTheme(<AssetScore score={score} />);

            expect(screen.getByText(/VISTA score: 7.5\/12/)).toBeInTheDocument();
        });

        it('displays CRITICAL category for score >= 10', () => {
            const score = createMockScore({
                criticalityScore: '3',
                dependencyScore: '3',
                exposureScore: '3',
                redundancyScore: '3',
            });
            renderWithTheme(<AssetScore score={score} />);

            expect(screen.getByText('CRITICAL')).toBeInTheDocument();
            expect(screen.getByText(/VISTA score: 12.0\/12/)).toBeInTheDocument();
        });

        it('displays HIGH category for score >= 7 and < 10', () => {
            const score = createMockScore({
                criticalityScore: '2.5',
                dependencyScore: '2.5',
                exposureScore: '2',
                redundancyScore: '0',
            });
            renderWithTheme(<AssetScore score={score} />);

            expect(screen.getByText('HIGH')).toBeInTheDocument();
        });

        it('displays MODERATE category for score >= 4 and < 7', () => {
            const score = createMockScore({
                criticalityScore: '1.5',
                dependencyScore: '1.5',
                exposureScore: '1',
                redundancyScore: '0',
            });
            renderWithTheme(<AssetScore score={score} />);

            expect(screen.getByText('MODERATE')).toBeInTheDocument();
        });

        it('displays LOW category for score < 4', () => {
            const score = createMockScore({
                criticalityScore: '0.5',
                dependencyScore: '0.5',
                exposureScore: '0.5',
                redundancyScore: '0.5',
            });
            renderWithTheme(<AssetScore score={score} />);

            expect(screen.getByText('LOW')).toBeInTheDocument();
        });

        it('displays score breakdown with all categories', () => {
            const score = createMockScore();
            renderWithTheme(<AssetScore score={score} />);

            expect(screen.getByText('Criticality (0-3)')).toBeInTheDocument();
            expect(screen.getByText('Dependency (0-3)')).toBeInTheDocument();
            expect(screen.getByText('Exposure (0-3)')).toBeInTheDocument();
            expect(screen.getByText('Redundancy (0-3)')).toBeInTheDocument();
        });

        it('displays individual scores correctly', () => {
            const score = createMockScore();
            renderWithTheme(<AssetScore score={score} />);

            const scoreTexts = screen.getAllByText(/^Score: \d+$/);
            expect(scoreTexts).toHaveLength(4);
            expect(scoreTexts[0]).toHaveTextContent('Score: 3');
            expect(scoreTexts[1]).toHaveTextContent('Score: 3');
            expect(scoreTexts[2]).toHaveTextContent('Score: 2');
            expect(scoreTexts[3]).toHaveTextContent('Score: 1');
        });

        it('handles zero scores', () => {
            const score = createMockScore({
                criticalityScore: '0',
                dependencyScore: '0',
                exposureScore: '0',
                redundancyScore: '0',
            });
            renderWithTheme(<AssetScore score={score} />);

            expect(screen.getByText(/VISTA score: 0.0\/12/)).toBeInTheDocument();
            expect(screen.getByText('LOW')).toBeInTheDocument();
        });

        it('handles invalid score strings by defaulting to 0', () => {
            const score = createMockScore({
                criticalityScore: 'invalid',
                dependencyScore: 'NaN',
                exposureScore: '',
                redundancyScore: 'null',
            });
            renderWithTheme(<AssetScore score={score} />);

            expect(screen.getByText(/VISTA score: 0.0\/12/)).toBeInTheDocument();
        });

        it('displays info icon with tooltip', () => {
            const score = createMockScore();
            renderWithTheme(<AssetScore score={score} />);

            const infoIcon = screen.getByLabelText('VISTA score breakdown');
            expect(infoIcon).toBeInTheDocument();
        });

        it('renders 12 segments in score bar', () => {
            const score = createMockScore();
            const { container } = renderWithTheme(<AssetScore score={score} />);

            const segments = container.querySelectorAll('[class*="MuiBox-root"]');
            expect(segments.length).toBeGreaterThan(12);
        });
    });

    describe('score calculation', () => {
        it('calculates total score correctly from string values', () => {
            const score = createMockScore({
                criticalityScore: '1.1',
                dependencyScore: '2.2',
                exposureScore: '3.3',
                redundancyScore: '0.4',
            });
            renderWithTheme(<AssetScore score={score} />);

            expect(screen.getByText(/VISTA score: 7.0\/12/)).toBeInTheDocument();
        });

        it('rounds score to one decimal place', () => {
            const score = createMockScore({
                criticalityScore: '1.11',
                dependencyScore: '2.22',
                exposureScore: '3.33',
                redundancyScore: '0.44',
            });
            renderWithTheme(<AssetScore score={score} />);

            expect(screen.getByText(/VISTA score: 7.1\/12/)).toBeInTheDocument();
        });
    });
});
