import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from '@mui/material/styles';
import type { MapStyleKey } from '../../constants';
import MapStylePanel from './MapStylePanel';
import theme from '@/theme';

vi.mock('../../constants', async () => {
    const actual = await vi.importActual('../../constants');
    return {
        ...actual,
        MAP_STYLE_OPTIONS: [
            { id: 'os-style', name: 'Ordnance Survey', key: 'os' },
            { id: 'streets-style', name: 'Streets', key: 'streets' },
            { id: 'satellite-style', name: 'Satellite', key: 'satellite' },
        ],
    };
});

describe('MapStylePanel', () => {
    const defaultProps = {
        currentStyle: 'os' as MapStyleKey,
        onStyleChange: vi.fn(),
        isOpen: true,
        onToggle: vi.fn(),
        showCoordinates: false,
        onShowCoordinatesChange: vi.fn(),
        showCpsIcons: false,
        onShowCpsIconsChange: vi.fn(),
    };

    const renderWithTheme = (component: React.ReactElement) => {
        return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
    };

    describe('Rendering', () => {
        it('does not render when isOpen is false', () => {
            const { container } = renderWithTheme(<MapStylePanel {...defaultProps} isOpen={false} />);

            expect(container.firstChild).toBeNull();
        });

        it('renders when isOpen is true', () => {
            renderWithTheme(<MapStylePanel {...defaultProps} />);

            expect(screen.getByText('Map styles')).toBeInTheDocument();
        });

        it('renders all map style options', () => {
            renderWithTheme(<MapStylePanel {...defaultProps} />);

            expect(screen.getByLabelText('Ordnance Survey')).toBeInTheDocument();
            expect(screen.getByLabelText('Streets')).toBeInTheDocument();
            expect(screen.getByLabelText('Satellite')).toBeInTheDocument();
        });

        it('selects current style', () => {
            renderWithTheme(<MapStylePanel {...defaultProps} currentStyle="os" />);

            const osRadio = screen.getByLabelText('Ordnance Survey') as HTMLInputElement;
            expect(osRadio.checked).toBe(true);
        });
    });

    describe('Style Selection', () => {
        it('calls onStyleChange when selecting a different style', () => {
            const onStyleChange = vi.fn();
            renderWithTheme(<MapStylePanel {...defaultProps} currentStyle="os" onStyleChange={onStyleChange} />);

            const streetsRadio = screen.getByLabelText('Streets');
            fireEvent.click(streetsRadio);

            expect(onStyleChange).toHaveBeenCalledWith('streets');
        });

        it('calls onToggle after style change', () => {
            const onToggle = vi.fn();
            renderWithTheme(<MapStylePanel {...defaultProps} currentStyle="os" onToggle={onToggle} />);

            const streetsRadio = screen.getByLabelText('Streets');
            fireEvent.click(streetsRadio);

            expect(onToggle).toHaveBeenCalledTimes(1);
        });

        it('does not call onStyleChange when selecting the same style', () => {
            const onStyleChange = vi.fn();
            renderWithTheme(<MapStylePanel {...defaultProps} currentStyle="os" onStyleChange={onStyleChange} />);

            const osRadio = screen.getByLabelText('Ordnance Survey');
            fireEvent.click(osRadio);

            expect(onStyleChange).not.toHaveBeenCalled();
        });

        it('does not call onToggle when clicking already selected style (Material-UI RadioGroup behavior)', () => {
            const onToggle = vi.fn();
            renderWithTheme(<MapStylePanel {...defaultProps} currentStyle="os" onToggle={onToggle} />);

            const osRadio = screen.getByLabelText('Ordnance Survey');
            fireEvent.click(osRadio);

            expect(onToggle).not.toHaveBeenCalled();
        });
    });

    describe('Toggle Controls', () => {
        it('renders Coordinates toggle', () => {
            renderWithTheme(<MapStylePanel {...defaultProps} />);

            expect(screen.getByLabelText('Coordinates')).toBeInTheDocument();
        });

        it('renders Show CPS icons toggle', () => {
            renderWithTheme(<MapStylePanel {...defaultProps} />);

            expect(screen.getByLabelText('Show CPS icons')).toBeInTheDocument();
        });

        it('calls onShowCoordinatesChange when Coordinates toggle is clicked', () => {
            const onShowCoordinatesChange = vi.fn();
            renderWithTheme(<MapStylePanel {...defaultProps} showCoordinates={false} onShowCoordinatesChange={onShowCoordinatesChange} />);

            const coordinatesToggle = screen.getByLabelText('Coordinates');
            fireEvent.click(coordinatesToggle);

            expect(onShowCoordinatesChange).toHaveBeenCalledWith(true);
        });

        it('calls onShowCpsIconsChange when Show CPS icons toggle is clicked', () => {
            const onShowCpsIconsChange = vi.fn();
            renderWithTheme(<MapStylePanel {...defaultProps} showCpsIcons={false} onShowCpsIconsChange={onShowCpsIconsChange} />);

            const cpsIconsToggle = screen.getByLabelText('Show CPS icons');
            fireEvent.click(cpsIconsToggle);

            expect(onShowCpsIconsChange).toHaveBeenCalledWith(true);
        });

        it('displays Coordinates toggle as checked when showCoordinates is true', () => {
            renderWithTheme(<MapStylePanel {...defaultProps} showCoordinates={true} />);

            const coordinatesToggle = screen.getByLabelText('Coordinates') as HTMLInputElement;
            expect(coordinatesToggle.checked).toBe(true);
        });

        it('displays Show CPS icons toggle as checked when showCpsIcons is true', () => {
            renderWithTheme(<MapStylePanel {...defaultProps} showCpsIcons={true} />);

            const cpsIconsToggle = screen.getByLabelText('Show CPS icons') as HTMLInputElement;
            expect(cpsIconsToggle.checked).toBe(true);
        });
    });
});
