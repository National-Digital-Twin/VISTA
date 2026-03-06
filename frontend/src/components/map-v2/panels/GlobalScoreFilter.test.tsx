// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { ThemeProvider } from '@mui/material/styles';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GlobalScoreFilter } from './GlobalScoreFilter';
import type { ScoreFilterValues } from '@/api/asset-score-filters';
import theme from '@/theme';

describe('GlobalScoreFilter', () => {
    const defaultProps = {
        onApply: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderWithTheme = (component: React.ReactElement) => {
        return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
    };

    describe('Rendering', () => {
        it('renders all filter sections', () => {
            renderWithTheme(<GlobalScoreFilter {...defaultProps} />);

            expect(screen.getByText('Criticality:')).toBeInTheDocument();
            expect(screen.getByText('Dependency:')).toBeInTheDocument();
            expect(screen.getByText('Exposure:')).toBeInTheDocument();
            expect(screen.getByText('Redundancy:')).toBeInTheDocument();
        });

        it('renders Apply button', () => {
            renderWithTheme(<GlobalScoreFilter {...defaultProps} />);

            expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
        });

        it('renders Clear button', () => {
            renderWithTheme(<GlobalScoreFilter {...defaultProps} />);

            expect(screen.getByTitle('Clear filter')).toBeInTheDocument();
        });

        it('renders all score value checkboxes (0, 1, 2, 3) for each category', () => {
            renderWithTheme(<GlobalScoreFilter {...defaultProps} />);

            const checkboxes = screen.getAllByRole('checkbox');
            expect(checkboxes).toHaveLength(12); // 4 values x 3 categories (Criticality, Exposure, Redundancy)
        });

        it('renders dependency min and max inputs', () => {
            renderWithTheme(<GlobalScoreFilter {...defaultProps} />);

            const inputs = screen.getAllByRole('spinbutton');
            expect(inputs).toHaveLength(2);
        });
    });

    describe('Initial values', () => {
        it('initializes with all checkboxes checked when no initialValues provided', () => {
            renderWithTheme(<GlobalScoreFilter {...defaultProps} />);

            const checkboxes = screen.getAllByRole('checkbox');
            checkboxes.forEach((checkbox) => {
                expect(checkbox).toBeChecked();
            });
        });

        it('initializes with provided initialValues', () => {
            const initialValues: ScoreFilterValues = {
                criticalityValues: [1, 2],
                exposureValues: null,
                redundancyValues: [0, 3],
                dependencyMin: '0.5',
                dependencyMax: '2.5',
            };

            renderWithTheme(<GlobalScoreFilter {...defaultProps} initialValues={initialValues} />);

            const inputs = screen.getAllByRole('spinbutton');
            expect(inputs[0]).toHaveValue(0.5);
            expect(inputs[1]).toHaveValue(2.5);
        });
    });

    describe('User interactions', () => {
        it('calls onApply with filter payload when Apply button is clicked', () => {
            const onApply = vi.fn();
            renderWithTheme(<GlobalScoreFilter {...defaultProps} onApply={onApply} />);

            const applyButton = screen.getByRole('button', { name: 'Apply' });
            fireEvent.click(applyButton);

            expect(onApply).toHaveBeenCalledTimes(1);
            expect(onApply).toHaveBeenCalledWith({
                criticalityValues: null,
                exposureValues: null,
                redundancyValues: null,
                dependencyMin: null,
                dependencyMax: null,
            });
        });

        it('resets to defaults when Clear button is clicked', () => {
            const initialValues: ScoreFilterValues = {
                criticalityValues: [1, 2],
                exposureValues: [0],
                redundancyValues: [3],
                dependencyMin: '0.5',
                dependencyMax: '2.5',
            };

            renderWithTheme(<GlobalScoreFilter {...defaultProps} initialValues={initialValues} />);

            const clearButton = screen.getByTitle('Clear filter');
            fireEvent.click(clearButton);

            const checkboxes = screen.getAllByRole('checkbox');
            checkboxes.forEach((checkbox) => {
                expect(checkbox).toBeChecked();
            });

            const inputs = screen.getAllByRole('spinbutton');
            expect(inputs[0]).toHaveValue(0);
            expect(inputs[1]).toHaveValue(3);
        });

        it('updates state when checkbox is clicked', () => {
            const onApply = vi.fn();
            renderWithTheme(<GlobalScoreFilter {...defaultProps} onApply={onApply} />);

            const checkboxes = screen.getAllByRole('checkbox');
            fireEvent.click(checkboxes[0]); // Uncheck first checkbox

            const applyButton = screen.getByRole('button', { name: 'Apply' });
            fireEvent.click(applyButton);

            expect(onApply).toHaveBeenCalledWith(
                expect.objectContaining({
                    criticalityValues: expect.any(Array),
                }),
            );
        });

        it('updates dependency min when input changes', () => {
            const onApply = vi.fn();
            renderWithTheme(<GlobalScoreFilter {...defaultProps} onApply={onApply} />);

            const inputs = screen.getAllByRole('spinbutton');
            fireEvent.change(inputs[0], { target: { value: '0.5' } });

            const applyButton = screen.getByRole('button', { name: 'Apply' });
            fireEvent.click(applyButton);

            expect(onApply).toHaveBeenCalledWith(
                expect.objectContaining({
                    dependencyMin: '0.5',
                }),
            );
        });
    });

    describe('Disabled state', () => {
        it('disables Apply button when disabled prop is true', () => {
            renderWithTheme(<GlobalScoreFilter {...defaultProps} disabled />);

            expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
        });

        it('disables Clear button when disabled prop is true', () => {
            renderWithTheme(<GlobalScoreFilter {...defaultProps} disabled />);

            expect(screen.getByTitle('Clear filter').closest('button')).toBeDisabled();
        });

        it('disables all checkboxes when disabled prop is true', () => {
            renderWithTheme(<GlobalScoreFilter {...defaultProps} disabled />);

            const checkboxes = screen.getAllByRole('checkbox');
            checkboxes.forEach((checkbox) => {
                expect(checkbox).toBeDisabled();
            });
        });

        it('disables dependency inputs when disabled prop is true', () => {
            renderWithTheme(<GlobalScoreFilter {...defaultProps} disabled />);

            const inputs = screen.getAllByRole('spinbutton');
            inputs.forEach((input) => {
                expect(input).toBeDisabled();
            });
        });
    });
});
