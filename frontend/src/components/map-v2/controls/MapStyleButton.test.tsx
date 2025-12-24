import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from '@mui/material/styles';
import MapStyleButton from './MapStyleButton';
import theme from '@/theme';

describe('MapStyleButton', () => {
    const defaultProps = {
        isOpen: false,
        onToggle: vi.fn(),
    };

    const renderWithTheme = (component: React.ReactElement) => {
        return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
    };

    describe('Rendering', () => {
        it('renders layers icon when closed', () => {
            renderWithTheme(<MapStyleButton {...defaultProps} />);

            const icon = screen.getByAltText('Layers');
            expect(icon).toHaveAttribute('src', '/icons/map-v2/layers.svg');
        });

        it('renders white layers icon when open', () => {
            renderWithTheme(<MapStyleButton {...defaultProps} isOpen={true} />);

            const icon = screen.getByAltText('Layers');
            expect(icon).toHaveAttribute('src', '/icons/map-v2/layers-white.svg');
        });
    });

    describe('Click Handling', () => {
        it('calls onToggle when clicked', () => {
            const onToggle = vi.fn();
            renderWithTheme(<MapStyleButton {...defaultProps} onToggle={onToggle} />);

            const buttons = screen.getAllByLabelText('Change map style');
            const button = buttons.find((btn) => btn.tagName === 'BUTTON') || buttons[0];
            fireEvent.click(button);

            expect(onToggle).toHaveBeenCalledTimes(1);
        });
    });

    describe('Ref Forwarding', () => {
        it('forwards ref to button element', () => {
            const ref = React.createRef<HTMLButtonElement>();
            renderWithTheme(<MapStyleButton {...defaultProps} ref={ref} />);

            expect(ref.current).toBeInstanceOf(HTMLButtonElement);
            const buttons = screen.getAllByLabelText('Change map style');
            const button = buttons.find((btn) => btn.tagName === 'BUTTON') || buttons[0];
            expect(ref.current).toBe(button);
        });
    });
});
