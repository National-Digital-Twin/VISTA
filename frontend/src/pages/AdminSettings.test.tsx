import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import AdminSettings from './AdminSettings';

vi.mock('@/components/AdminSettings/UsersTab', () => ({
    default: () => <div data-testid="users-tab">Users Tab</div>,
}));

vi.mock('@/components/AdminSettings/InvitesTab', () => ({
    default: () => <div data-testid="invites-tab">Invites Tab</div>,
}));

vi.mock('@/components/AdminSettings/GroupsTab', () => ({
    default: () => <div data-testid="groups-tab">Groups Tab</div>,
}));

vi.mock('@/components/AdminSettings/AccessRequestsTab', () => ({
    default: () => <div data-testid="access-requests-tab">Access Requests Tab</div>,
}));

const Wrapper = ({ children }: { children: React.ReactNode }) => <BrowserRouter>{children}</BrowserRouter>;

describe('AdminSettings', () => {
    describe('Rendering', () => {
        it('renders the page title', () => {
            render(
                <Wrapper>
                    <AdminSettings />
                </Wrapper>,
            );

            expect(screen.getByText('Admin settings')).toBeInTheDocument();
        });

        it('renders all tab labels', () => {
            render(
                <Wrapper>
                    <AdminSettings />
                </Wrapper>,
            );

            expect(screen.getByText('Users')).toBeInTheDocument();
            expect(screen.getByText('Invites')).toBeInTheDocument();
            expect(screen.getByText('Groups')).toBeInTheDocument();
            expect(screen.getByText('Access requests')).toBeInTheDocument();
        });

        it('renders the first tab (Users) by default', () => {
            render(
                <Wrapper>
                    <AdminSettings />
                </Wrapper>,
            );

            expect(screen.getByTestId('users-tab')).toBeInTheDocument();
        });
    });

    describe('Tab Navigation', () => {
        it('switches to Invites tab when clicked', () => {
            render(
                <Wrapper>
                    <AdminSettings />
                </Wrapper>,
            );

            const invitesTab = screen.getByRole('tab', { name: 'Invites' });
            fireEvent.click(invitesTab);

            expect(screen.getByTestId('invites-tab')).toBeInTheDocument();
            expect(screen.queryByTestId('users-tab')).not.toBeInTheDocument();
        });

        it('switches to Groups tab when clicked', () => {
            render(
                <Wrapper>
                    <AdminSettings />
                </Wrapper>,
            );

            const groupsTab = screen.getByRole('tab', { name: 'Groups' });
            fireEvent.click(groupsTab);

            expect(screen.getByTestId('groups-tab')).toBeInTheDocument();
            expect(screen.queryByTestId('users-tab')).not.toBeInTheDocument();
        });

        it('switches to Access requests tab when clicked', () => {
            render(
                <Wrapper>
                    <AdminSettings />
                </Wrapper>,
            );

            const accessRequestsTab = screen.getByRole('tab', { name: /Access requests/i });
            fireEvent.click(accessRequestsTab);

            expect(screen.getByTestId('access-requests-tab')).toBeInTheDocument();
            expect(screen.queryByTestId('users-tab')).not.toBeInTheDocument();
        });

        it('can navigate back to Users tab', () => {
            render(
                <Wrapper>
                    <AdminSettings />
                </Wrapper>,
            );

            const groupsTab = screen.getByRole('tab', { name: 'Groups' });
            fireEvent.click(groupsTab);
            expect(screen.getByTestId('groups-tab')).toBeInTheDocument();

            const usersTab = screen.getByRole('tab', { name: 'Users' });
            fireEvent.click(usersTab);

            expect(screen.getByTestId('users-tab')).toBeInTheDocument();
            expect(screen.queryByTestId('groups-tab')).not.toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('has proper ARIA labels for tabs', () => {
            render(
                <Wrapper>
                    <AdminSettings />
                </Wrapper>,
            );

            expect(screen.getByLabelText('admin settings tabs')).toBeInTheDocument();
        });

        it('associates tab panels with their tabs', () => {
            render(
                <Wrapper>
                    <AdminSettings />
                </Wrapper>,
            );

            const usersTab = screen.getByRole('tab', { name: 'Users' });
            expect(usersTab).toHaveAttribute('id', 'admin-tab-0');
            expect(usersTab).toHaveAttribute('aria-controls', 'admin-tabpanel-0');
        });
    });

    describe('Tab Indicator', () => {
        it('shows error indicator dot on Access requests tab', () => {
            render(
                <Wrapper>
                    <AdminSettings />
                </Wrapper>,
            );

            const accessRequestsTab = screen.getByRole('tab', { name: /Access requests/i });
            const indicatorDot = accessRequestsTab.parentElement?.querySelector('.MuiBox-root');
            expect(indicatorDot).toBeInTheDocument();
        });
    });
});
