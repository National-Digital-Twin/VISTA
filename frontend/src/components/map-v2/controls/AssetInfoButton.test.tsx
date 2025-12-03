import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from '@mui/material/styles';
import AssetInfoButton from './AssetInfoButton';
import theme from '@/theme';

describe('AssetInfoButton', () => {
    const defaultProps = {
        isOpen: false,
        onToggle: vi.fn(),
    };

    const renderWithTheme = (component: React.ReactElement) => {
        return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
    };

    describe('Rendering', () => {
        it('renders asset table icon when closed', () => {
            renderWithTheme(<AssetInfoButton {...defaultProps} />);

            const icon = screen.getByAltText('Asset information');
            expect(icon).toHaveAttribute('src', '/icons/map-v2/asset-table.svg');
        });

        it('renders white asset table icon when open', () => {
            renderWithTheme(<AssetInfoButton {...defaultProps} isOpen={true} />);

            const icon = screen.getByAltText('Asset information');
            expect(icon).toHaveAttribute('src', '/icons/map-v2/asset-table-white.svg');
        });

        it('renders button with correct aria-label', () => {
            renderWithTheme(<AssetInfoButton {...defaultProps} />);

            const buttons = screen.getAllByLabelText('Asset information');
            const button = buttons.find((btn) => btn.tagName === 'BUTTON');
            expect(button).toBeInTheDocument();
        });
    });

    describe('Click Handling', () => {
        it('calls onToggle when clicked', () => {
            const onToggle = vi.fn();
            renderWithTheme(<AssetInfoButton {...defaultProps} onToggle={onToggle} />);

            const buttons = screen.getAllByLabelText('Asset information');
            const button = buttons.find((btn) => btn.tagName === 'BUTTON') || buttons[0];
            fireEvent.click(button);

            expect(onToggle).toHaveBeenCalledTimes(1);
        });
    });

    describe('Active State', () => {
        it('applies active styling when isOpen is true', () => {
            renderWithTheme(<AssetInfoButton {...defaultProps} isOpen={true} />);

            const buttons = screen.getAllByLabelText('Asset information');
            const button = buttons.find((btn) => btn.tagName === 'BUTTON') || buttons[0];
            expect(button).toHaveStyle({ backgroundColor: 'rgb(54, 112, 179)' }); // primary.main
        });

        it('applies default styling when isOpen is false', () => {
            renderWithTheme(<AssetInfoButton {...defaultProps} isOpen={false} />);

            const buttons = screen.getAllByLabelText('Asset information');
            const button = buttons.find((btn) => btn.tagName === 'BUTTON') || buttons[0];
            expect(button).toHaveStyle({ backgroundColor: 'rgb(255, 255, 255)' }); // background.paper
        });
    });

    describe('Ref Forwarding', () => {
        it('forwards ref to button element', () => {
            const ref = React.createRef<HTMLButtonElement>();
            renderWithTheme(<AssetInfoButton {...defaultProps} ref={ref} />);

            expect(ref.current).toBeInstanceOf(HTMLButtonElement);
            const buttons = screen.getAllByLabelText('Asset information');
            const button = buttons.find((btn) => btn.tagName === 'BUTTON') || buttons[0];
            expect(ref.current).toBe(button);
        });
    });
});
