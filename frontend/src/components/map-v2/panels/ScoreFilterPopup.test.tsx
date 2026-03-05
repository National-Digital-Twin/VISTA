// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { ThemeProvider } from '@mui/material/styles';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScoreFilterPopup } from './ScoreFilterPopup';
import type { ScoreFilterValues } from '@/api/asset-score-filters';
import theme from '@/theme';

describe('ScoreFilterPopup', () => {
    const defaultProps = {
        open: true,
        onClose: vi.fn(),
        onApply: vi.fn(),
        assetTypeName: 'Hospital',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderWithTheme = (component: React.ReactElement) => {
        return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
    };

    describe('Rendering', () => {
        it('renders dialog when open is true', () => {
            renderWithTheme(<ScoreFilterPopup {...defaultProps} />);

            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        it('does not render dialog when open is false', () => {
            renderWithTheme(<ScoreFilterPopup {...defaultProps} open={false} />);

            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });

        it('renders asset type name in title', () => {
            renderWithTheme(<ScoreFilterPopup {...defaultProps} assetTypeName="Power Station" />);

            expect(screen.getByText('Power Station:')).toBeInTheDocument();
        });

        it('renders all filter sections', () => {
            renderWithTheme(<ScoreFilterPopup {...defaultProps} />);

            expect(screen.getByText('Criticality:')).toBeInTheDocument();
            expect(screen.getByText('Dependency:')).toBeInTheDocument();
            expect(screen.getByText('Exposure:')).toBeInTheDocument();
            expect(screen.getByText('Redundancy:')).toBeInTheDocument();
        });

        it('renders Cancel button', () => {
            renderWithTheme(<ScoreFilterPopup {...defaultProps} />);

            expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
        });

        it('renders Apply button', () => {
            renderWithTheme(<ScoreFilterPopup {...defaultProps} />);

            expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
        });

        it('renders all score value checkboxes', () => {
            renderWithTheme(<ScoreFilterPopup {...defaultProps} />);

            const checkboxes = screen.getAllByRole('checkbox');
            expect(checkboxes).toHaveLength(12); // 4 values x 3 categories
        });

        it('renders dependency min and max inputs', () => {
            renderWithTheme(<ScoreFilterPopup {...defaultProps} />);

            const inputs = screen.getAllByRole('spinbutton');
            expect(inputs).toHaveLength(2);
        });
    });

    describe('Initial values', () => {
        it('initializes with all checkboxes checked when no initialValues provided', () => {
            renderWithTheme(<ScoreFilterPopup {...defaultProps} />);

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

            renderWithTheme(<ScoreFilterPopup {...defaultProps} initialValues={initialValues} />);

            const inputs = screen.getAllByRole('spinbutton');
            expect(inputs[0]).toHaveValue(0.5);
            expect(inputs[1]).toHaveValue(2.5);
        });
    });

    describe('User interactions', () => {
        it('calls onClose when Cancel button is clicked', () => {
            const onClose = vi.fn();
            renderWithTheme(<ScoreFilterPopup {...defaultProps} onClose={onClose} />);

            const cancelButton = screen.getByRole('button', { name: 'Cancel' });
            fireEvent.click(cancelButton);

            expect(onClose).toHaveBeenCalledTimes(1);
        });

        it('calls onClose when Escape key is pressed', async () => {
            const onClose = vi.fn();
            renderWithTheme(<ScoreFilterPopup {...defaultProps} onClose={onClose} />);

            fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

            await waitFor(() => {
                expect(onClose).toHaveBeenCalled();
            });
        });

        it('calls onApply with filter payload when Apply button is clicked', () => {
            const onApply = vi.fn();
            renderWithTheme(<ScoreFilterPopup {...defaultProps} onApply={onApply} />);

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

        it('updates state when checkbox is clicked', () => {
            const onApply = vi.fn();
            renderWithTheme(<ScoreFilterPopup {...defaultProps} onApply={onApply} />);

            const checkboxes = screen.getAllByRole('checkbox');
            fireEvent.click(checkboxes[0]); // Uncheck first checkbox (criticality 0)

            const applyButton = screen.getByRole('button', { name: 'Apply' });
            fireEvent.click(applyButton);

            expect(onApply).toHaveBeenCalledWith(
                expect.objectContaining({
                    criticalityValues: expect.arrayContaining([1, 2, 3]),
                }),
            );
        });

        it('updates dependency min when input changes', () => {
            const onApply = vi.fn();
            renderWithTheme(<ScoreFilterPopup {...defaultProps} onApply={onApply} />);

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

        it('updates dependency max when input changes', () => {
            const onApply = vi.fn();
            renderWithTheme(<ScoreFilterPopup {...defaultProps} onApply={onApply} />);

            const inputs = screen.getAllByRole('spinbutton');
            fireEvent.change(inputs[1], { target: { value: '2.5' } });

            const applyButton = screen.getByRole('button', { name: 'Apply' });
            fireEvent.click(applyButton);

            expect(onApply).toHaveBeenCalledWith(
                expect.objectContaining({
                    dependencyMax: '2.5',
                }),
            );
        });
    });

    describe('Dialog rendering', () => {
        it('renders dialog paper element', () => {
            renderWithTheme(<ScoreFilterPopup {...defaultProps} />);

            const dialog = screen.getByRole('dialog');
            expect(dialog).toHaveClass('MuiPaper-root');
        });
    });
});
