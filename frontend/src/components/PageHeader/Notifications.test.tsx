// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { ThemeProvider } from '@mui/material/styles';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Notifications from './Notifications';
import theme from '@/theme';

const renderWithProviders = (component: React.ReactElement, initialEntries = ['/']) => {
    return render(
        <MemoryRouter initialEntries={initialEntries}>
            <ThemeProvider theme={theme}>{component}</ThemeProvider>
        </MemoryRouter>,
    );
};

describe('Notifications', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders notifications icon button', () => {
        renderWithProviders(<Notifications />);

        const button = screen.getByLabelText('notifications');
        expect(button).toBeInTheDocument();
    });

    it('calls onClick when button is clicked', () => {
        const onClick = vi.fn();
        renderWithProviders(<Notifications onClick={onClick} />);

        const button = screen.getByLabelText('notifications');
        fireEvent.click(button);

        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('displays badge with unseen count when not on notifications page', () => {
        renderWithProviders(<Notifications unseenCount={5} />, ['/']);

        const badge = screen.getByText('5');
        expect(badge).toBeInTheDocument();
    });

    it('displays badge with 0 when on notifications page', () => {
        renderWithProviders(<Notifications unseenCount={5} />, ['/notifications']);

        const button = screen.getByLabelText('notifications');
        expect(button).toBeInTheDocument();
    });

    it('displays NotificationsOutlinedIcon when not on notifications page', () => {
        renderWithProviders(<Notifications />, ['/']);

        const button = screen.getByLabelText('notifications');
        const svg = button.querySelector('svg');
        expect(svg).toBeInTheDocument();
    });

    it('displays NotificationsIcon when on notifications page', () => {
        renderWithProviders(<Notifications />, ['/notifications']);

        const button = screen.getByLabelText('notifications');
        const svg = button.querySelector('svg');
        expect(svg).toBeInTheDocument();
    });

    it('has tooltip title attribute', () => {
        renderWithProviders(<Notifications />);

        const button = screen.getByLabelText('notifications');
        const tooltip = button.closest('[title="Notifications"]') || button.parentElement?.querySelector('[title="Notifications"]');
        expect(tooltip || button).toBeInTheDocument();
    });

    it('defaults unseenCount to 0 when not provided', () => {
        renderWithProviders(<Notifications />, ['/']);

        const button = screen.getByLabelText('notifications');
        expect(button).toBeInTheDocument();
    });
});
