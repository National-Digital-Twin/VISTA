import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from '@mui/material/styles';

import IconToggle from './index';
import theme from '@/theme';

describe('IconToggle', () => {
    const defaultProps = {
        checked: false,
        onChange: vi.fn(),
    };

    const renderWithTheme = (component: React.ReactElement) => {
        return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
    };

    describe('Rendering', () => {
        it('renders VisibilityOffIcon when unchecked', () => {
            renderWithTheme(<IconToggle {...defaultProps} />);
            const button = screen.getByRole('button');
            expect(button).toBeInTheDocument();
            const visibilityOffIcon = button.querySelector('svg[data-testid="VisibilityOffIcon"]');
            expect(visibilityOffIcon).toBeInTheDocument();
        });

        it('renders VisibilityIcon when checked', () => {
            renderWithTheme(<IconToggle {...defaultProps} checked={true} />);
            const button = screen.getByRole('button');
            const visibilityIcon = button.querySelector('svg[data-testid="VisibilityIcon"]');
            expect(visibilityIcon).toBeInTheDocument();
        });

        it('applies primary color to VisibilityIcon when checked', () => {
            renderWithTheme(<IconToggle {...defaultProps} checked={true} />);
            const button = screen.getByRole('button');
            const visibilityIcon = button.querySelector('svg[data-testid="VisibilityIcon"]');
            expect(visibilityIcon).toBeInTheDocument();
            expect(visibilityIcon).toHaveStyle({ color: 'rgb(54, 112, 179)' });
        });

        it('applies aria-label when provided', () => {
            renderWithTheme(<IconToggle {...defaultProps} aria-label="Toggle visibility" />);
            const button = screen.getByRole('button', { name: 'Toggle visibility' });
            expect(button).toBeInTheDocument();
        });

        it('applies aria-labelledby when provided', () => {
            renderWithTheme(
                <div>
                    <span id="label">Toggle</span>
                    <IconToggle {...defaultProps} aria-labelledby="label" />
                </div>,
            );
            const button = screen.getByRole('button');
            expect(button).toHaveAttribute('aria-labelledby', 'label');
        });
    });

    describe('Interactions', () => {
        it('calls onChange when clicked', () => {
            const onChange = vi.fn();
            renderWithTheme(<IconToggle {...defaultProps} onChange={onChange} />);
            const button = screen.getByRole('button');
            fireEvent.click(button);
            expect(onChange).toHaveBeenCalledTimes(1);
        });

        it('calls onChange when Enter key is pressed', () => {
            const onChange = vi.fn();
            renderWithTheme(<IconToggle {...defaultProps} onChange={onChange} />);
            const button = screen.getByRole('button');
            fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
            expect(onChange).toHaveBeenCalledTimes(1);
        });

        it('calls onChange when Space key is pressed', () => {
            const onChange = vi.fn();
            renderWithTheme(<IconToggle {...defaultProps} onChange={onChange} />);
            const button = screen.getByRole('button');
            fireEvent.keyDown(button, { key: ' ', code: 'Space' });
            expect(onChange).toHaveBeenCalledTimes(1);
        });

        it('does not call onChange when disabled and clicked', () => {
            const onChange = vi.fn();
            renderWithTheme(<IconToggle {...defaultProps} onChange={onChange} disabled={true} />);
            const button = screen.getByRole('button');
            fireEvent.click(button);
            expect(onChange).not.toHaveBeenCalled();
        });

        it('does not call onChange when disabled and key is pressed', () => {
            const onChange = vi.fn();
            renderWithTheme(<IconToggle {...defaultProps} onChange={onChange} disabled={true} />);
            const button = screen.getByRole('button');
            fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
            expect(onChange).not.toHaveBeenCalled();
        });

        it('prevents default on Space key press', () => {
            const onChange = vi.fn();
            renderWithTheme(<IconToggle {...defaultProps} onChange={onChange} />);
            const button = screen.getByRole('button');
            const event = new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true, cancelable: true });
            const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
            fireEvent(button, event);
            expect(preventDefaultSpy).toHaveBeenCalled();
        });
    });

    describe('Size', () => {
        it('renders with small size', () => {
            renderWithTheme(<IconToggle {...defaultProps} size="small" />);
            const button = screen.getByRole('button');
            expect(button).toBeInTheDocument();
            const icon = button.querySelector('svg');
            expect(icon).toBeInTheDocument();
        });

        it('renders with medium size by default', () => {
            renderWithTheme(<IconToggle {...defaultProps} />);
            const button = screen.getByRole('button');
            expect(button).toBeInTheDocument();
            const icon = button.querySelector('svg');
            expect(icon).toBeInTheDocument();
        });

        it('renders with large size', () => {
            renderWithTheme(<IconToggle {...defaultProps} size="large" />);
            const button = screen.getByRole('button');
            expect(button).toBeInTheDocument();
            const icon = button.querySelector('svg');
            expect(icon).toBeInTheDocument();
        });
    });

    describe('Disabled state', () => {
        it('disables the button when disabled prop is true', () => {
            renderWithTheme(<IconToggle {...defaultProps} disabled={true} />);
            const button = screen.getByRole('button');
            expect(button).toBeDisabled();
        });

        it('enables the button when disabled prop is false', () => {
            renderWithTheme(<IconToggle {...defaultProps} disabled={false} />);
            const button = screen.getByRole('button');
            expect(button).not.toBeDisabled();
        });
    });

    describe('Tri-state visibility (state prop)', () => {
        it('renders VisibilityIcon when state is visible', () => {
            renderWithTheme(<IconToggle {...defaultProps} state="visible" />);
            const button = screen.getByRole('button');
            const visibilityIcon = button.querySelector('svg[data-testid="VisibilityIcon"]');
            expect(visibilityIcon).toBeInTheDocument();
        });

        it('renders VisibilityOffIcon when state is hidden', () => {
            renderWithTheme(<IconToggle {...defaultProps} state="hidden" />);
            const button = screen.getByRole('button');
            const visibilityOffIcon = button.querySelector('svg[data-testid="VisibilityOffIcon"]');
            expect(visibilityOffIcon).toBeInTheDocument();
        });

        it('renders VisibilityOutlinedIcon when state is partial', () => {
            renderWithTheme(<IconToggle {...defaultProps} state="partial" />);
            const button = screen.getByRole('button');
            const visibilityOutlinedIcon = button.querySelector('svg[data-testid="VisibilityOutlinedIcon"]');
            expect(visibilityOutlinedIcon).toBeInTheDocument();
        });

        it('applies primary color to VisibilityOutlinedIcon when state is partial', () => {
            renderWithTheme(<IconToggle {...defaultProps} state="partial" />);
            const button = screen.getByRole('button');
            const visibilityOutlinedIcon = button.querySelector('svg[data-testid="VisibilityOutlinedIcon"]');
            expect(visibilityOutlinedIcon).toBeInTheDocument();
            expect(visibilityOutlinedIcon).toHaveStyle({ color: 'rgb(54, 112, 179)' });
        });

        it('state prop takes precedence over checked prop', () => {
            renderWithTheme(<IconToggle {...defaultProps} checked={true} state="partial" />);
            const button = screen.getByRole('button');
            const visibilityOutlinedIcon = button.querySelector('svg[data-testid="VisibilityOutlinedIcon"]');
            expect(visibilityOutlinedIcon).toBeInTheDocument();
        });

        it('falls back to checked prop when state is not provided', () => {
            renderWithTheme(<IconToggle {...defaultProps} checked={true} />);
            const button = screen.getByRole('button');
            const visibilityIcon = button.querySelector('svg[data-testid="VisibilityIcon"]');
            expect(visibilityIcon).toBeInTheDocument();
        });
    });
});
