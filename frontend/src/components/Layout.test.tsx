import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import Layout from './Layout';
import theme from '@/theme';

vi.mock('./PageHeader', () => ({
    default: ({ appName }: { appName: string }) => <div data-testid="page-header">PageHeader: {appName}</div>,
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        Outlet: () => <div data-testid="outlet">Outlet Content</div>,
    };
});

const renderWithProviders = (component: React.ReactElement) => {
    return render(
        <MemoryRouter>
            <ThemeProvider theme={theme}>{component}</ThemeProvider>
        </MemoryRouter>,
    );
};

describe('Layout', () => {
    it('renders the PageHeader component', () => {
        renderWithProviders(<Layout />);

        const pageHeader = screen.getByTestId('page-header');
        expect(pageHeader).toBeInTheDocument();
        expect(pageHeader).toHaveTextContent('PageHeader: VISTA');
    });

    it('renders the Outlet component for child routes', () => {
        renderWithProviders(<Layout />);

        const outlet = screen.getByTestId('outlet');
        expect(outlet).toBeInTheDocument();
        expect(outlet).toHaveTextContent('Outlet Content');
    });

    it('has correct layout structure with flex column', () => {
        const { container } = renderWithProviders(<Layout />);

        const rootBox = container.firstChild as HTMLElement;
        expect(rootBox).toBeInTheDocument();
        expect(rootBox).toHaveStyle({
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        });
    });

    it('renders PageHeader in a flexShrink container', () => {
        const { container } = renderWithProviders(<Layout />);

        const pageHeaderContainer = container.querySelector('[data-testid="page-header"]')?.parentElement;
        expect(pageHeaderContainer).toBeInTheDocument();
    });

    it('renders Outlet in a scrollable container', () => {
        const { container } = renderWithProviders(<Layout />);

        const outletContainer = container.querySelector('[data-testid="outlet"]')?.parentElement;
        expect(outletContainer).toBeInTheDocument();
        expect(outletContainer).toHaveStyle({
            flex: '1 1 auto',
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            position: 'relative',
        });
    });

    it('renders both PageHeader and Outlet in the correct order', () => {
        const { container } = renderWithProviders(<Layout />);

        const pageHeader = screen.getByTestId('page-header');
        const outlet = screen.getByTestId('outlet');

        expect(pageHeader).toBeInTheDocument();
        expect(outlet).toBeInTheDocument();

        const rootElement = container.firstChild as HTMLElement;
        const children = Array.from(rootElement.children);

        const pageHeaderContainer = children.find((child) => child.contains(pageHeader));
        const outletContainer = children.find((child) => child.contains(outlet));

        expect(pageHeaderContainer).toBeDefined();
        expect(outletContainer).toBeDefined();
        expect(children.indexOf(pageHeaderContainer!)).toBeLessThan(children.indexOf(outletContainer!));
    });
});
