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

    it('renders location name', () => {
        renderWithTheme(<ResourceTooltip {...defaultProps} />);

        expect(screen.getByText('Depot Alpha')).toBeInTheDocument();
    });

    it('renders type name', () => {
        renderWithTheme(<ResourceTooltip {...defaultProps} />);

        expect(screen.getByText('Sandbags')).toBeInTheDocument();
    });

    it('renders stock info with unit', () => {
        renderWithTheme(<ResourceTooltip {...defaultProps} />);

        expect(screen.getByText('50 / 100 bags')).toBeInTheDocument();
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
