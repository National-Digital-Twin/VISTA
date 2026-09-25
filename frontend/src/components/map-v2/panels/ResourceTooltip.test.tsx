// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the UK's Department for Business, Innovation, Science and Trade (BIST) as the governing entity.

import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, it, expect } from 'vitest';
import ResourceTooltip from './ResourceTooltip';
import theme from '@/theme';

const renderWithTheme = (component: ReactElement) => render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);

describe('ResourceTooltip', () => {
    const defaultProps = {
        name: 'Depot Alpha',
        typeName: 'Sandbags',
        currentStock: 50,
        maxCapacity: 100,
        unit: 'bags',
    };

    it.each([
        ['location name', 'Depot Alpha'],
        ['type name', 'Sandbags'],
        ['stock info with unit', '50 / 100 bags'],
    ])('renders %s', (_, text) => {
        renderWithTheme(<ResourceTooltip {...defaultProps} />);

        expect(screen.getByText(text)).toBeInTheDocument();
    });

    it('renders progress bar', () => {
        renderWithTheme(<ResourceTooltip {...defaultProps} />);

        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('renders with zero stock', () => {
        renderWithTheme(<ResourceTooltip {...defaultProps} currentStock={0} />);

        expect(screen.getByText('0 / 100 bags')).toBeInTheDocument();
    });

    it('renders with full stock', () => {
        renderWithTheme(<ResourceTooltip {...defaultProps} currentStock={100} />);

        expect(screen.getByText('100 / 100 bags')).toBeInTheDocument();
    });
});
