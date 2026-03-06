// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import type MapboxDraw from '@mapbox/mapbox-gl-draw';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import DrawingToolbar from './DrawingToolbar';
import theme from '@/theme';

vi.mock('@/components/ToggleSwitch', () => ({
    default: ({ checked, onChange }: { checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
        <input
            type="checkbox"
            checked={checked}
            onChange={(e) => {
                const syntheticEvent = {
                    ...e,
                    target: { ...e.target, checked: !checked },
                } as React.ChangeEvent<HTMLInputElement>;
                onChange(syntheticEvent);
            }}
            data-testid="toggle-switch"
        />
    ),
}));

describe('DrawingToolbar', () => {
    const createMockDrawRef = (): React.RefObject<MapboxDraw | null> => {
        return {
            current: {
                changeMode: vi.fn(),
            } as any,
        };
    };

    const defaultProps = {
        drawRef: createMockDrawRef(),
        drawingMode: null as 'circle' | 'polygon' | null,
        onDrawingModeChange: vi.fn(),
        primaryAssets: false,
        onPrimaryAssetsChange: vi.fn(),
        dependentAssets: false,
        onDependentAssetsChange: vi.fn(),
    };

    const renderWithTheme = (component: React.ReactElement) => {
        return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
    };

    describe('Rendering', () => {
        it('renders drawing tools group', () => {
            renderWithTheme(<DrawingToolbar {...defaultProps} />);

            expect(screen.getByRole('group', { name: 'Drawing tools' })).toBeInTheDocument();
        });

        it('renders asset filters group', () => {
            renderWithTheme(<DrawingToolbar {...defaultProps} />);

            expect(screen.getByRole('group', { name: 'Asset filters' })).toBeInTheDocument();
        });

        it('renders circle drawing button', () => {
            renderWithTheme(<DrawingToolbar {...defaultProps} />);

            const buttons = screen.getAllByLabelText('Draw circle');
            expect(buttons.length).toBeGreaterThan(0);
        });

        it('renders polygon drawing button', () => {
            renderWithTheme(<DrawingToolbar {...defaultProps} />);

            const buttons = screen.getAllByLabelText('Draw polygon');
            expect(buttons.length).toBeGreaterThan(0);
        });

        it('renders primary assets toggle', () => {
            renderWithTheme(<DrawingToolbar {...defaultProps} />);

            expect(screen.getByText('Primary assets')).toBeInTheDocument();
        });

        it('renders dependent assets toggle', () => {
            renderWithTheme(<DrawingToolbar {...defaultProps} />);

            expect(screen.getByText('Dependent assets')).toBeInTheDocument();
        });
    });

    describe('Circle Drawing', () => {
        it('activates circle mode when circle button is clicked', () => {
            const onDrawingModeChange = vi.fn();
            const drawRef = createMockDrawRef();
            renderWithTheme(<DrawingToolbar {...defaultProps} drawRef={drawRef} onDrawingModeChange={onDrawingModeChange} />);

            const buttons = screen.getAllByLabelText('Draw circle');
            const circleButton = buttons.find((btn) => btn.tagName === 'BUTTON') || buttons[0];
            fireEvent.click(circleButton);

            expect(drawRef.current?.changeMode).toHaveBeenCalledWith('drag_circle');
            expect(onDrawingModeChange).toHaveBeenCalledWith('circle');
        });

        it('deactivates circle mode when circle button is clicked again', () => {
            const onDrawingModeChange = vi.fn();
            const drawRef = createMockDrawRef();
            renderWithTheme(<DrawingToolbar {...defaultProps} drawRef={drawRef} drawingMode="circle" onDrawingModeChange={onDrawingModeChange} />);

            const buttons = screen.getAllByLabelText('Stop drawing circle');
            const circleButton = buttons.find((btn) => btn.tagName === 'BUTTON') || buttons[0];
            fireEvent.click(circleButton);

            expect(drawRef.current?.changeMode).toHaveBeenCalledWith('simple_select');
            expect(onDrawingModeChange).toHaveBeenCalledWith(null);
        });

        it('shows active state when circle mode is active', () => {
            renderWithTheme(<DrawingToolbar {...defaultProps} drawingMode="circle" />);

            const buttons = screen.getAllByLabelText('Stop drawing circle');
            const circleButton = buttons.find((btn) => btn.tagName === 'BUTTON') || buttons[0];
            expect(circleButton).toHaveStyle({ backgroundColor: 'rgb(54, 112, 179)' }); // primary.main
        });
    });

    describe('Polygon Drawing', () => {
        it('activates polygon mode when polygon button is clicked', () => {
            const onDrawingModeChange = vi.fn();
            const drawRef = createMockDrawRef();
            renderWithTheme(<DrawingToolbar {...defaultProps} drawRef={drawRef} onDrawingModeChange={onDrawingModeChange} />);

            const buttons = screen.getAllByLabelText('Draw polygon');
            const polygonButton = buttons.find((btn) => btn.tagName === 'BUTTON') || buttons[0];
            fireEvent.click(polygonButton);

            expect(drawRef.current?.changeMode).toHaveBeenCalledWith('draw_polygon');
            expect(onDrawingModeChange).toHaveBeenCalledWith('polygon');
        });

        it('deactivates polygon mode when polygon button is clicked again', () => {
            const onDrawingModeChange = vi.fn();
            const drawRef = createMockDrawRef();
            renderWithTheme(<DrawingToolbar {...defaultProps} drawRef={drawRef} drawingMode="polygon" onDrawingModeChange={onDrawingModeChange} />);

            const buttons = screen.getAllByLabelText('Stop drawing polygon');
            const polygonButton = buttons.find((btn) => btn.tagName === 'BUTTON') || buttons[0];
            fireEvent.click(polygonButton);

            expect(drawRef.current?.changeMode).toHaveBeenCalledWith('simple_select');
            expect(onDrawingModeChange).toHaveBeenCalledWith(null);
        });

        it('shows active state when polygon mode is active', () => {
            renderWithTheme(<DrawingToolbar {...defaultProps} drawingMode="polygon" />);

            const buttons = screen.getAllByLabelText('Stop drawing polygon');
            const polygonButton = buttons.find((btn) => btn.tagName === 'BUTTON') || buttons[0];
            expect(polygonButton).toHaveStyle({ backgroundColor: 'rgb(54, 112, 179)' }); // primary.main
        });
    });

    describe('Asset Filters', () => {
        it('calls onPrimaryAssetsChange when primary assets toggle is changed', () => {
            const onPrimaryAssetsChange = vi.fn();
            renderWithTheme(<DrawingToolbar {...defaultProps} onPrimaryAssetsChange={onPrimaryAssetsChange} />);

            const toggles = screen.getAllByTestId('toggle-switch');
            const primaryToggle = toggles[0];
            fireEvent.click(primaryToggle);

            expect(onPrimaryAssetsChange).toHaveBeenCalledWith(true);
        });

        it('calls onDependentAssetsChange when dependent assets toggle is changed', () => {
            const onDependentAssetsChange = vi.fn();
            renderWithTheme(<DrawingToolbar {...defaultProps} onDependentAssetsChange={onDependentAssetsChange} />);

            const toggles = screen.getAllByTestId('toggle-switch');
            const dependentToggle = toggles[1];
            fireEvent.click(dependentToggle);

            expect(onDependentAssetsChange).toHaveBeenCalledWith(true);
        });

        it('reflects primary assets state in toggle', () => {
            renderWithTheme(<DrawingToolbar {...defaultProps} primaryAssets={true} />);

            const toggles = screen.getAllByTestId('toggle-switch');
            expect(toggles[0]).toBeChecked();
        });

        it('reflects dependent assets state in toggle', () => {
            renderWithTheme(<DrawingToolbar {...defaultProps} dependentAssets={true} />);

            const toggles = screen.getAllByTestId('toggle-switch');
            expect(toggles[1]).toBeChecked();
        });
    });

    describe('Error Handling', () => {
        it('does not throw error when drawRef is null', () => {
            const drawRef = { current: null };
            renderWithTheme(<DrawingToolbar {...defaultProps} drawRef={drawRef} />);

            const buttons = screen.getAllByLabelText('Draw circle');
            const circleButton = buttons.find((btn) => btn.tagName === 'BUTTON') || buttons[0];
            expect(() => fireEvent.click(circleButton)).not.toThrow();
        });
    });
});
