import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from '@mui/material/styles';
import AssetsView from './AssetsView';
import theme from '@/theme';

describe('AssetsView', () => {
    const defaultProps = {
        onClose: vi.fn(),
    };

    const renderWithTheme = (component: React.ReactElement) => {
        return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
    };

    describe('Rendering', () => {
        it('renders title', () => {
            renderWithTheme(<AssetsView {...defaultProps} />);

            expect(screen.getByText('Assets')).toBeInTheDocument();
        });

        it('renders placeholder message', () => {
            renderWithTheme(<AssetsView {...defaultProps} />);

            expect(screen.getByText('Asset information - coming soon')).toBeInTheDocument();
        });

        it('renders close button', () => {
            renderWithTheme(<AssetsView {...defaultProps} />);

            const closeButton = screen.getByLabelText('Close panel');
            expect(closeButton).toBeInTheDocument();
        });
    });

    describe('Close Functionality', () => {
        it('calls onClose when close button is clicked', () => {
            const onClose = vi.fn();
            renderWithTheme(<AssetsView {...defaultProps} onClose={onClose} />);

            const closeButton = screen.getByLabelText('Close panel');
            fireEvent.click(closeButton);

            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });
});
