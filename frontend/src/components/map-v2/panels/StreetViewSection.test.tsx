import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ThemeProvider } from '@mui/material/styles';
import StreetViewSection from './StreetViewSection';
import theme from '@/theme';

const renderWithTheme = (component: React.ReactElement) => {
    return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('StreetViewSection', () => {
    describe('when coordinates are available', () => {
        it('renders Street View link with correct URL', () => {
            const streetViewUrl = 'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=51.5074,-0.1278';
            renderWithTheme(<StreetViewSection hasCoordinates={true} streetViewUrl={streetViewUrl} />);

            const link = screen.getByRole('link');
            expect(link).toHaveAttribute('href', streetViewUrl);
            expect(link).toHaveAttribute('target', '_blank');
            expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        });

        it('displays Street View icon and text', () => {
            const streetViewUrl = 'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=51.5074,-0.1278';
            renderWithTheme(<StreetViewSection hasCoordinates={true} streetViewUrl={streetViewUrl} />);

            expect(screen.getByText('Click to view Street View')).toBeInTheDocument();
            expect(screen.getByText('Opens in new tab')).toBeInTheDocument();
        });
    });

    describe('when coordinates are not available', () => {
        it('displays info alert when hasCoordinates is false', () => {
            renderWithTheme(<StreetViewSection hasCoordinates={false} streetViewUrl={null} />);

            expect(screen.getByText('Coordinates not available for Street View')).toBeInTheDocument();
        });

        it('displays info alert when streetViewUrl is null', () => {
            renderWithTheme(<StreetViewSection hasCoordinates={true} streetViewUrl={null} />);

            expect(screen.getByText('Coordinates not available for Street View')).toBeInTheDocument();
        });
    });
});
