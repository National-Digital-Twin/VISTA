import { ThemeProvider } from '@mui/material/styles';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScoreFilterCheckboxGroup, DependencyRangeFields } from './ScoreFilterFields';
import theme from '@/theme';

describe('ScoreFilterCheckboxGroup', () => {
    const defaultProps = {
        label: 'Criticality',
        values: [0, 1, 2, 3],
        onChange: vi.fn(),
        setter: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderWithTheme = (component: React.ReactElement) => {
        return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
    };

    describe('Rendering', () => {
        it('renders label correctly', () => {
            renderWithTheme(<ScoreFilterCheckboxGroup {...defaultProps} />);

            expect(screen.getByText('Criticality:')).toBeInTheDocument();
        });

        it('renders four checkboxes for score values 0, 1, 2, 3', () => {
            renderWithTheme(<ScoreFilterCheckboxGroup {...defaultProps} />);

            expect(screen.getByLabelText('0')).toBeInTheDocument();
            expect(screen.getByLabelText('1')).toBeInTheDocument();
            expect(screen.getByLabelText('2')).toBeInTheDocument();
            expect(screen.getByLabelText('3')).toBeInTheDocument();
        });

        it('checks checkboxes that are in values array', () => {
            renderWithTheme(<ScoreFilterCheckboxGroup {...defaultProps} values={[1, 3]} />);

            expect(screen.getByLabelText('0')).not.toBeChecked();
            expect(screen.getByLabelText('1')).toBeChecked();
            expect(screen.getByLabelText('2')).not.toBeChecked();
            expect(screen.getByLabelText('3')).toBeChecked();
        });

        it('renders empty state when values is empty array', () => {
            renderWithTheme(<ScoreFilterCheckboxGroup {...defaultProps} values={[]} />);

            expect(screen.getByLabelText('0')).not.toBeChecked();
            expect(screen.getByLabelText('1')).not.toBeChecked();
            expect(screen.getByLabelText('2')).not.toBeChecked();
            expect(screen.getByLabelText('3')).not.toBeChecked();
        });
    });

    describe('User interactions', () => {
        it('calls onChange with setter, value, and checked state when checkbox is clicked', () => {
            const onChange = vi.fn();
            const setter = vi.fn();
            renderWithTheme(<ScoreFilterCheckboxGroup {...defaultProps} onChange={onChange} setter={setter} />);

            const checkbox2 = screen.getByLabelText('2');
            fireEvent.click(checkbox2);

            expect(onChange).toHaveBeenCalledWith(setter, 2, false); // Was checked, now unchecked
        });

        it('calls onChange with checked=true when clicking unchecked checkbox', () => {
            const onChange = vi.fn();
            const setter = vi.fn();
            renderWithTheme(<ScoreFilterCheckboxGroup {...defaultProps} values={[0, 1]} onChange={onChange} setter={setter} />);

            const checkbox2 = screen.getByLabelText('2');
            fireEvent.click(checkbox2);

            expect(onChange).toHaveBeenCalledWith(setter, 2, true);
        });
    });

    describe('Disabled state', () => {
        it('disables all checkboxes when disabled prop is true', () => {
            renderWithTheme(<ScoreFilterCheckboxGroup {...defaultProps} disabled />);

            expect(screen.getByLabelText('0')).toBeDisabled();
            expect(screen.getByLabelText('1')).toBeDisabled();
            expect(screen.getByLabelText('2')).toBeDisabled();
            expect(screen.getByLabelText('3')).toBeDisabled();
        });

        it('enables all checkboxes when disabled prop is false', () => {
            renderWithTheme(<ScoreFilterCheckboxGroup {...defaultProps} disabled={false} />);

            expect(screen.getByLabelText('0')).not.toBeDisabled();
            expect(screen.getByLabelText('1')).not.toBeDisabled();
            expect(screen.getByLabelText('2')).not.toBeDisabled();
            expect(screen.getByLabelText('3')).not.toBeDisabled();
        });
    });
});

describe('DependencyRangeFields', () => {
    const defaultProps = {
        dependencyMin: '0',
        dependencyMax: '3',
        onMinChange: vi.fn(),
        onMaxChange: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderWithTheme = (component: React.ReactElement) => {
        return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
    };

    describe('Rendering', () => {
        it('renders Dependency label', () => {
            renderWithTheme(<DependencyRangeFields {...defaultProps} />);

            expect(screen.getByText('Dependency:')).toBeInTheDocument();
        });

        it('renders "to" separator text', () => {
            renderWithTheme(<DependencyRangeFields {...defaultProps} />);

            expect(screen.getByText('to')).toBeInTheDocument();
        });

        it('renders min input with correct value', () => {
            renderWithTheme(<DependencyRangeFields {...defaultProps} dependencyMin="0.5" />);

            const inputs = screen.getAllByRole('spinbutton');
            expect(inputs[0]).toHaveValue(0.5);
        });

        it('renders max input with correct value', () => {
            renderWithTheme(<DependencyRangeFields {...defaultProps} dependencyMax="2.5" />);

            const inputs = screen.getAllByRole('spinbutton');
            expect(inputs[1]).toHaveValue(2.5);
        });

        it('renders inputs as number type', () => {
            renderWithTheme(<DependencyRangeFields {...defaultProps} />);

            const inputs = screen.getAllByRole('spinbutton');
            expect(inputs[0]).toHaveAttribute('type', 'number');
            expect(inputs[1]).toHaveAttribute('type', 'number');
        });
    });

    describe('User interactions', () => {
        it('calls onMinChange when min input value changes', () => {
            const onMinChange = vi.fn();
            renderWithTheme(<DependencyRangeFields {...defaultProps} onMinChange={onMinChange} />);

            const inputs = screen.getAllByRole('spinbutton');
            fireEvent.change(inputs[0], { target: { value: '0.5' } });

            expect(onMinChange).toHaveBeenCalledWith('0.5');
        });

        it('calls onMaxChange when max input value changes', () => {
            const onMaxChange = vi.fn();
            renderWithTheme(<DependencyRangeFields {...defaultProps} onMaxChange={onMaxChange} />);

            const inputs = screen.getAllByRole('spinbutton');
            fireEvent.change(inputs[1], { target: { value: '2.5' } });

            expect(onMaxChange).toHaveBeenCalledWith('2.5');
        });
    });

    describe('Disabled state', () => {
        it('disables both inputs when disabled prop is true', () => {
            renderWithTheme(<DependencyRangeFields {...defaultProps} disabled />);

            const inputs = screen.getAllByRole('spinbutton');
            expect(inputs[0]).toBeDisabled();
            expect(inputs[1]).toBeDisabled();
        });

        it('enables both inputs when disabled prop is false', () => {
            renderWithTheme(<DependencyRangeFields {...defaultProps} disabled={false} />);

            const inputs = screen.getAllByRole('spinbutton');
            expect(inputs[0]).not.toBeDisabled();
            expect(inputs[1]).not.toBeDisabled();
        });
    });

    describe('Input constraints', () => {
        it('has min attribute of 0', () => {
            renderWithTheme(<DependencyRangeFields {...defaultProps} />);

            const inputs = screen.getAllByRole('spinbutton');
            expect(inputs[0]).toHaveAttribute('min', '0');
            expect(inputs[1]).toHaveAttribute('min', '0');
        });

        it('has max attribute of 3', () => {
            renderWithTheme(<DependencyRangeFields {...defaultProps} />);

            const inputs = screen.getAllByRole('spinbutton');
            expect(inputs[0]).toHaveAttribute('max', '3');
            expect(inputs[1]).toHaveAttribute('max', '3');
        });

        it('has step attribute of 0.01', () => {
            renderWithTheme(<DependencyRangeFields {...defaultProps} />);

            const inputs = screen.getAllByRole('spinbutton');
            expect(inputs[0]).toHaveAttribute('step', '0.01');
            expect(inputs[1]).toHaveAttribute('step', '0.01');
        });
    });

    describe('Value clamping', () => {
        it('clamps min value below 0 to 0', () => {
            const onMinChange = vi.fn();
            renderWithTheme(<DependencyRangeFields {...defaultProps} onMinChange={onMinChange} />);

            const inputs = screen.getAllByRole('spinbutton');
            fireEvent.change(inputs[0], { target: { value: '-1' } });

            expect(onMinChange).toHaveBeenCalledWith('0');
        });

        it('clamps max value above 3 to 3', () => {
            const onMaxChange = vi.fn();
            renderWithTheme(<DependencyRangeFields {...defaultProps} onMaxChange={onMaxChange} />);

            const inputs = screen.getAllByRole('spinbutton');
            fireEvent.change(inputs[1], { target: { value: '5' } });

            expect(onMaxChange).toHaveBeenCalledWith('3');
        });

        it('allows values within valid range', () => {
            const onMinChange = vi.fn();
            renderWithTheme(<DependencyRangeFields {...defaultProps} onMinChange={onMinChange} />);

            const inputs = screen.getAllByRole('spinbutton');
            fireEvent.change(inputs[0], { target: { value: '1.5' } });

            expect(onMinChange).toHaveBeenCalledWith('1.5');
        });

        it('allows empty string value', () => {
            const onMinChange = vi.fn();
            renderWithTheme(<DependencyRangeFields {...defaultProps} onMinChange={onMinChange} />);

            const inputs = screen.getAllByRole('spinbutton');
            fireEvent.change(inputs[0], { target: { value: '' } });

            expect(onMinChange).toHaveBeenCalledWith('');
        });
    });
});
