// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { ThemeProvider } from '@mui/material/styles';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import MapPanelButton from './MapPanelButton';
import theme from '@/theme';

describe('MapPanelButton', () => {
    const defaultProps = {
        label: 'Test Panel',
        icon: <img src="/test-icon.svg" alt="Test" width={24} height={24} />,
        isActive: false,
        onClick: vi.fn(),
    };

    const renderWithTheme = (component: React.ReactElement) => {
        return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
    };

    describe('Rendering', () => {
        it('renders label and icon', () => {
            renderWithTheme(<MapPanelButton {...defaultProps} />);

            expect(screen.getByText('Test Panel')).toBeInTheDocument();
            expect(screen.getByAltText('Test')).toBeInTheDocument();
        });

        it('renders with custom label', () => {
            renderWithTheme(<MapPanelButton {...defaultProps} label="Custom Label" />);

            expect(screen.getByText('Custom Label')).toBeInTheDocument();
        });
    });

    describe('Click Handling', () => {
        it('calls onClick when button is clicked', () => {
            const onClick = vi.fn();
            renderWithTheme(<MapPanelButton {...defaultProps} onClick={onClick} />);

            const button = screen.getByText('Test Panel').closest('div[role="button"]') || screen.getByText('Test Panel').parentElement;
            if (button) {
                fireEvent.click(button);
            }

            expect(onClick).toHaveBeenCalledTimes(1);
        });

        it('handles multiple clicks', () => {
            const onClick = vi.fn();
            renderWithTheme(<MapPanelButton {...defaultProps} onClick={onClick} />);

            const button = screen.getByText('Test Panel').closest('div[role="button"]') || screen.getByText('Test Panel').parentElement;
            if (button) {
                fireEvent.click(button);
                fireEvent.click(button);
            }

            expect(onClick).toHaveBeenCalledTimes(2);
        });
    });

    describe('Active State', () => {
        it('applies active background color to icon container when isActive is true', () => {
            renderWithTheme(<MapPanelButton {...defaultProps} isActive={true} />);

            const icon = screen.getByAltText('Test');
            const iconContainer = icon.closest('div');
            expect(iconContainer).toHaveStyle({ backgroundColor: 'rgb(212, 227, 255)' }); // chip.main color
        });

        it('applies transparent background to icon container when isActive is false', () => {
            renderWithTheme(<MapPanelButton {...defaultProps} isActive={false} />);

            const icon = screen.getByAltText('Test');
            const iconContainer = icon.closest('div');
            const bgColor = iconContainer?.style.backgroundColor || (iconContainer ? globalThis.getComputedStyle(iconContainer).backgroundColor : '');
            expect(bgColor === 'transparent' || bgColor === 'rgba(0, 0, 0, 0)' || bgColor === '').toBe(true);
        });

        it('maintains active background color on icon container hover when active', () => {
            renderWithTheme(<MapPanelButton {...defaultProps} isActive={true} />);

            const icon = screen.getByAltText('Test');
            const iconContainer = icon.closest('div');
            if (iconContainer) {
                fireEvent.mouseEnter(iconContainer);
                expect(iconContainer).toHaveStyle({ backgroundColor: 'rgb(212, 227, 255)' });
            }
        });
    });

    describe('Styling', () => {
        it('applies correct font weight (not bold)', () => {
            renderWithTheme(<MapPanelButton {...defaultProps} />);

            const label = screen.getByText('Test Panel');
            expect(label).toHaveStyle({ fontWeight: '400' });
        });

        it('maintains font weight when active', () => {
            renderWithTheme(<MapPanelButton {...defaultProps} isActive={true} />);

            const label = screen.getByText('Test Panel');
            expect(label).toHaveStyle({ fontWeight: '400' });
        });

        it('renders icon with correct dimensions', () => {
            renderWithTheme(<MapPanelButton {...defaultProps} />);

            const icon = screen.getByAltText('Test');
            expect(icon).toHaveAttribute('width', '24');
            expect(icon).toHaveAttribute('height', '24');
        });
    });

    describe('Accessibility', () => {
        it('has pointer cursor style', () => {
            renderWithTheme(<MapPanelButton {...defaultProps} />);

            const button = screen.getByText('Test Panel').closest('div');
            expect(button).toHaveStyle({ cursor: 'pointer' });
        });
    });
});
