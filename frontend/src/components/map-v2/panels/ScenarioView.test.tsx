import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from '@mui/material/styles';
import ScenarioView from './ScenarioView';
import theme from '@/theme';

describe('ScenarioView', () => {
    const defaultProps = {
        onItemClick: vi.fn(),
        onClose: vi.fn(),
    };

    const renderWithTheme = (component: React.ReactElement) => {
        return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
    };

    describe('Rendering', () => {
        it('renders scenario name', () => {
            renderWithTheme(<ScenarioView {...defaultProps} />);

            expect(screen.getByText('Flood in Newport')).toBeInTheDocument();
        });

        it('renders navigation links', () => {
            renderWithTheme(<ScenarioView {...defaultProps} />);

            expect(screen.getByText('Assets')).toBeInTheDocument();
            expect(screen.getByText('Exposure')).toBeInTheDocument();
            expect(screen.getByText('Polygons')).toBeInTheDocument();
        });

        it('renders status messages', () => {
            renderWithTheme(<ScenarioView {...defaultProps} />);

            expect(screen.getByText('No assets added to the map')).toBeInTheDocument();
            expect(screen.getByText('No exposure added to the map')).toBeInTheDocument();
            expect(screen.getByText('No polygons added to the map')).toBeInTheDocument();
        });

        it('renders close button', () => {
            renderWithTheme(<ScenarioView {...defaultProps} />);

            const closeButton = screen.getByLabelText('Close panel');
            expect(closeButton).toBeInTheDocument();
        });
    });

    describe('Navigation', () => {
        it('calls onItemClick with "assets" when Assets link is clicked', () => {
            const onItemClick = vi.fn();
            renderWithTheme(<ScenarioView {...defaultProps} onItemClick={onItemClick} />);

            const assetsLink = screen.getByText('Assets');
            fireEvent.click(assetsLink);

            expect(onItemClick).toHaveBeenCalledWith('assets');
        });

        it('calls onItemClick with "exposure" when Exposure link is clicked', () => {
            const onItemClick = vi.fn();
            renderWithTheme(<ScenarioView {...defaultProps} onItemClick={onItemClick} />);

            const exposureLink = screen.getByText('Exposure');
            fireEvent.click(exposureLink);

            expect(onItemClick).toHaveBeenCalledWith('exposure');
        });

        it('calls onItemClick with "polygons" when Polygons link is clicked', () => {
            const onItemClick = vi.fn();
            renderWithTheme(<ScenarioView {...defaultProps} onItemClick={onItemClick} />);

            const polygonsLink = screen.getByText('Polygons');
            fireEvent.click(polygonsLink);

            expect(onItemClick).toHaveBeenCalledWith('polygons');
        });
    });

    describe('Close Functionality', () => {
        it('calls onClose when close button is clicked', () => {
            const onClose = vi.fn();
            renderWithTheme(<ScenarioView {...defaultProps} onClose={onClose} />);

            const closeButton = screen.getByLabelText('Close panel');
            fireEvent.click(closeButton);

            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });
});
