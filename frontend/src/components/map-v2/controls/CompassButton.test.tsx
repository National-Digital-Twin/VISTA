// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { ThemeProvider } from '@mui/material/styles';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import { describe, it, expect, vi } from 'vitest';
import CompassButton from './CompassButton';
import theme from '@/theme';

describe('CompassButton', () => {
    const createMockMapRef = (): React.RefObject<MapRef | null> => {
        const mockMap = {
            easeTo: vi.fn(),
        };
        return {
            current: {
                getMap: () => mockMap,
            } as unknown as MapRef,
        };
    };

    const renderWithTheme = (component: React.ReactElement) => {
        return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
    };

    describe('Rendering', () => {
        it('renders compass icon', () => {
            const mapRef = createMockMapRef();
            renderWithTheme(<CompassButton mapRef={mapRef} />);

            expect(screen.getByAltText('Reset view')).toBeInTheDocument();
        });

        it('applies rotation transform based on bearing', () => {
            const mapRef = createMockMapRef();
            renderWithTheme(<CompassButton mapRef={mapRef} bearing={45} />);

            const icon = screen.getByAltText('Reset view');
            expect(icon).toHaveStyle({ transform: 'rotate(-45deg)' });
        });

        it('uses default bearing of 0 when not provided', () => {
            const mapRef = createMockMapRef();
            renderWithTheme(<CompassButton mapRef={mapRef} />);

            const icon = screen.getByAltText('Reset view');
            expect(icon).toHaveStyle({ transform: 'rotate(0deg)' });
        });
    });

    describe('Click Handling', () => {
        it('calls map.easeTo with correct parameters when clicked', () => {
            const mapRef = createMockMapRef();
            const mockMap = mapRef.current!.getMap() as any;
            renderWithTheme(<CompassButton mapRef={mapRef} />);

            const button = screen.getByLabelText('Reset View');
            fireEvent.click(button);

            expect(mockMap.easeTo).toHaveBeenCalledWith({
                bearing: 0,
                pitch: 0,
                duration: 1000,
            });
        });

        it('does not throw error when mapRef is null', () => {
            const mapRef = { current: null };
            renderWithTheme(<CompassButton mapRef={mapRef} />);

            const button = screen.getByLabelText('Reset View');
            expect(() => fireEvent.click(button)).not.toThrow();
        });
    });
});
