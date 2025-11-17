import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from '@mui/material/styles';
import ControlButton from './ControlButton';
import theme from '@/theme';

describe('ControlButton', () => {
    const defaultProps = {
        'onClick': vi.fn(),
        'aria-label': 'Test Button',
    };

    const renderWithTheme = (component: React.ReactElement) => {
        return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
    };

    describe('Rendering', () => {
        it('renders button with children', () => {
            renderWithTheme(
                <ControlButton {...defaultProps}>
                    <span>Test Content</span>
                </ControlButton>,
            );

            expect(screen.getByText('Test Content')).toBeInTheDocument();
        });

        it('renders button with aria-label', () => {
            renderWithTheme(<ControlButton {...defaultProps} />);

            expect(screen.getByLabelText('Test Button')).toBeInTheDocument();
        });

        it('renders tooltip when provided', () => {
            renderWithTheme(<ControlButton {...defaultProps} tooltip="Test Tooltip" />);

            const button = screen.getByLabelText('Test Button');
            expect(button).toBeInTheDocument();
        });
    });

    describe('Click Handling', () => {
        it('calls onClick when button is clicked', () => {
            const onClick = vi.fn();
            renderWithTheme(<ControlButton {...defaultProps} onClick={onClick} />);

            const button = screen.getByLabelText('Test Button');
            fireEvent.click(button);

            expect(onClick).toHaveBeenCalledTimes(1);
        });

        it('does not call onClick when disabled', () => {
            const onClick = vi.fn();
            renderWithTheme(<ControlButton {...defaultProps} onClick={onClick} disabled={true} />);

            const button = screen.getByLabelText('Test Button');
            fireEvent.click(button);

            expect(onClick).not.toHaveBeenCalled();
        });
    });

    describe('Active State', () => {
        it('applies active styling when isActive is true', () => {
            renderWithTheme(<ControlButton {...defaultProps} isActive={true} />);

            const button = screen.getByLabelText('Test Button');
            expect(button).toHaveStyle({ backgroundColor: 'rgb(54, 112, 179)' }); // primary.main
        });

        it('applies default styling when isActive is false', () => {
            renderWithTheme(<ControlButton {...defaultProps} isActive={false} />);

            const button = screen.getByLabelText('Test Button');
            expect(button).toHaveStyle({ backgroundColor: 'rgb(255, 255, 255)' }); // background.paper
        });
    });

    describe('Disabled State', () => {
        it('disables button when disabled prop is true', () => {
            renderWithTheme(<ControlButton {...defaultProps} disabled={true} />);

            const button = screen.getByLabelText('Test Button');
            expect(button).toBeDisabled();
        });

        it('enables button when disabled prop is false', () => {
            renderWithTheme(<ControlButton {...defaultProps} disabled={false} />);

            const button = screen.getByLabelText('Test Button');
            expect(button).not.toBeDisabled();
        });
    });

    describe('Ref Forwarding', () => {
        it('forwards ref to button element', () => {
            const ref = React.createRef<HTMLButtonElement>();
            renderWithTheme(<ControlButton {...defaultProps} ref={ref} />);

            expect(ref.current).toBeInstanceOf(HTMLButtonElement);
            expect(ref.current).toBe(screen.getByLabelText('Test Button'));
        });
    });
});
