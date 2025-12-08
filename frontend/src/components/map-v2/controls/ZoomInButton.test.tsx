import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from '@mui/material/styles';
import type { MapRef } from 'react-map-gl/maplibre';
import ZoomInButton from './ZoomInButton';
import theme from '@/theme';

describe('ZoomInButton', () => {
    const createMockMapRef = (): React.RefObject<MapRef | null> => {
        const mockMap = {
            zoomIn: vi.fn(),
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
        it('renders zoom in icon', () => {
            const mapRef = createMockMapRef();
            renderWithTheme(<ZoomInButton mapRef={mapRef} />);

            expect(screen.getByAltText('Zoom in')).toBeInTheDocument();
        });
    });

    describe('Click Handling', () => {
        it('calls map.zoomIn when clicked', () => {
            const mapRef = createMockMapRef();
            const mockMap = mapRef.current!.getMap() as any;
            renderWithTheme(<ZoomInButton mapRef={mapRef} />);

            const button = screen.getByLabelText('Zoom In');
            fireEvent.click(button);

            expect(mockMap.zoomIn).toHaveBeenCalledWith({ duration: 300 });
        });

        it('does not throw error when mapRef is null', () => {
            const mapRef = { current: null };
            renderWithTheme(<ZoomInButton mapRef={mapRef} />);

            const button = screen.getByLabelText('Zoom In');
            expect(() => fireEvent.click(button)).not.toThrow();
        });
    });
});
