// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { ThemeProvider } from '@mui/material/styles';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import { describe, it, expect, vi } from 'vitest';
import ZoomOutButton from './ZoomOutButton';
import theme from '@/theme';

describe('ZoomOutButton', () => {
    const createMockMapRef = (): React.RefObject<MapRef | null> => {
        const mockMap = {
            zoomOut: vi.fn(),
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
        it('renders zoom out icon', () => {
            const mapRef = createMockMapRef();
            renderWithTheme(<ZoomOutButton mapRef={mapRef} />);

            expect(screen.getByAltText('Zoom out')).toBeInTheDocument();
        });
    });

    describe('Click Handling', () => {
        it('calls map.zoomOut when clicked', () => {
            const mapRef = createMockMapRef();
            const mockMap = mapRef.current!.getMap() as any;
            renderWithTheme(<ZoomOutButton mapRef={mapRef} />);

            const button = screen.getByLabelText('Zoom Out');
            fireEvent.click(button);

            expect(mockMap.zoomOut).toHaveBeenCalledWith({ duration: 300 });
        });

        it('does not throw error when mapRef is null', () => {
            const mapRef = { current: null };
            renderWithTheme(<ZoomOutButton mapRef={mapRef} />);

            const button = screen.getByLabelText('Zoom Out');
            expect(() => fireEvent.click(button)).not.toThrow();
        });
    });
});
