// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { ThemeProvider } from '@mui/material/styles';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import DrawPolygonButton from './DrawPolygonButton';
import theme from '@/theme';

describe('DrawPolygonButton', () => {
    const defaultProps = {
        isActive: false,
        onToggle: vi.fn(),
    };

    const renderWithTheme = (component: React.ReactElement) => {
        return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
    };

    describe('Rendering', () => {
        it('renders polygon icon when inactive', () => {
            renderWithTheme(<DrawPolygonButton {...defaultProps} />);

            const icon = screen.getByAltText('Open drawing toolbar');
            expect(icon).toHaveAttribute('src', '/icons/map-v2/polygon.svg');
        });

        it('renders white polygon icon when active', () => {
            renderWithTheme(<DrawPolygonButton {...defaultProps} isActive={true} />);

            const icon = screen.getByAltText('Close drawing toolbar');
            expect(icon).toHaveAttribute('src', '/icons/map-v2/polygon-white.svg');
        });
    });

    describe('Click Handling', () => {
        it('calls onToggle when clicked', () => {
            const onToggle = vi.fn();
            renderWithTheme(<DrawPolygonButton {...defaultProps} onToggle={onToggle} />);

            const buttons = screen.getAllByLabelText('Open drawing toolbar');
            const button = buttons.find((btn) => btn.tagName === 'BUTTON') || buttons[0];
            fireEvent.click(button);

            expect(onToggle).toHaveBeenCalledTimes(1);
        });
    });

    describe('Active State', () => {
        it('applies active styling when isActive is true', () => {
            renderWithTheme(<DrawPolygonButton {...defaultProps} isActive={true} />);

            const buttons = screen.getAllByLabelText('Close drawing toolbar');
            const button = buttons.find((btn) => btn.tagName === 'BUTTON') || buttons[0];
            expect(button).toHaveStyle({ backgroundColor: 'rgb(54, 112, 179)' }); // primary.main
        });

        it('applies default styling when isActive is false', () => {
            renderWithTheme(<DrawPolygonButton {...defaultProps} isActive={false} />);

            const buttons = screen.getAllByLabelText('Open drawing toolbar');
            const button = buttons.find((btn) => btn.tagName === 'BUTTON') || buttons[0];
            expect(button).toHaveStyle({ backgroundColor: 'rgb(255, 255, 255)' }); // background.paper
        });
    });
});
