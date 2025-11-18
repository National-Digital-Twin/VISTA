import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from '@mui/material/styles';
import LegendButton from './LegendButton';
import theme from '@/theme';

describe('LegendButton', () => {
    const defaultProps = {
        isOpen: false,
        onToggle: vi.fn(),
    };

    const renderWithTheme = (component: React.ReactElement) => {
        return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
    };

    describe('Rendering', () => {
        it('renders legend icon', () => {
            renderWithTheme(<LegendButton {...defaultProps} />);

            expect(screen.getByAltText('Legend')).toBeInTheDocument();
        });
    });

    describe('Click Handling', () => {
        it('calls onToggle when clicked', () => {
            const onToggle = vi.fn();
            renderWithTheme(<LegendButton {...defaultProps} onToggle={onToggle} />);

            const buttons = screen.getAllByLabelText('Toggle legend');
            const button = buttons.find((btn) => btn.tagName === 'BUTTON') || buttons[0];
            fireEvent.click(button);

            expect(onToggle).toHaveBeenCalledTimes(1);
        });
    });

    describe('Ref Forwarding', () => {
        it('forwards ref to button element', () => {
            const ref = React.createRef<HTMLButtonElement>();
            renderWithTheme(<LegendButton {...defaultProps} ref={ref} />);

            expect(ref.current).toBeInstanceOf(HTMLButtonElement);
            const buttons = screen.getAllByLabelText('Toggle legend');
            const button = buttons.find((btn) => btn.tagName === 'BUTTON') || buttons[0];
            expect(ref.current).toBe(button);
        });
    });
});
