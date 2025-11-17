import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ThemeProvider } from '@mui/material/styles';
import LegendPanel from './LegendPanel';
import theme from '@/theme';

describe('LegendPanel', () => {
    const renderWithTheme = (component: React.ReactElement) => {
        return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
    };

    describe('Rendering', () => {
        it('does not render when open is false', () => {
            const { container } = renderWithTheme(<LegendPanel open={false} />);

            expect(container.firstChild).toBeNull();
        });

        it('renders when open is true', () => {
            renderWithTheme(<LegendPanel open={true} />);

            expect(screen.getByText('Legend')).toBeInTheDocument();
            expect(screen.getByText('Road Criticality')).toBeInTheDocument();
        });

        it('renders all legend items', () => {
            renderWithTheme(<LegendPanel open={true} />);

            expect(screen.getByText('Low')).toBeInTheDocument();
            expect(screen.getByText('Medium')).toBeInTheDocument();
            expect(screen.getByText('High')).toBeInTheDocument();
        });

        it('renders legend color indicators', () => {
            renderWithTheme(<LegendPanel open={true} />);

            expect(screen.getByTestId('legend-low')).toBeInTheDocument();
            expect(screen.getByTestId('legend-medium')).toBeInTheDocument();
            expect(screen.getByTestId('legend-high')).toBeInTheDocument();
        });
    });

    describe('Legend Colors', () => {
        it('applies correct color for low criticality', () => {
            renderWithTheme(<LegendPanel open={true} />);

            const lowIndicator = screen.getByTestId('legend-low');
            expect(lowIndicator).toHaveStyle({ backgroundColor: '#4CAF50' });
        });

        it('applies correct color for medium criticality', () => {
            renderWithTheme(<LegendPanel open={true} />);

            const mediumIndicator = screen.getByTestId('legend-medium');
            expect(mediumIndicator).toHaveStyle({ backgroundColor: '#FF9800' });
        });

        it('applies correct color for high criticality', () => {
            renderWithTheme(<LegendPanel open={true} />);

            const highIndicator = screen.getByTestId('legend-high');
            expect(highIndicator).toHaveStyle({ backgroundColor: '#F44336' });
        });
    });
});
