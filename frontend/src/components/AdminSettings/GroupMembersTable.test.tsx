import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from '@mui/material/styles';
import { GroupMembersTable, type GroupMembersTableUser } from './GroupMembersTable';
import theme from '@/theme';

const renderWithTheme = (props: React.ComponentProps<typeof GroupMembersTable>) => {
    return render(
        <ThemeProvider theme={theme}>
            <GroupMembersTable {...props} />
        </ThemeProvider>,
    );
};

const defaultUsers: GroupMembersTableUser[] = [
    { id: 'u1', name: 'Alice', organisation: 'org-a', userType: 'Admin' },
    { id: 'u2', name: 'Bob', organisation: 'org-b', userType: 'General' },
];

const defaultProps: React.ComponentProps<typeof GroupMembersTable> = {
    users: defaultUsers,
    showCheckboxColumn: false,
    selectedUserIds: new Set(),
    adminUserIds: new Set(['u1']),
    onUserCheckboxChange: vi.fn(),
    onSelectAll: vi.fn(),
    allVisibleUsersSelected: false,
    someVisibleUsersSelected: false,
    onUserClick: vi.fn(),
    showMemberSinceColumn: false,
    emptyMessage: 'No users',
    onNameMenuOpen: vi.fn(),
    onOrganisationMenuOpen: vi.fn(),
    onUserTypeMenuOpen: vi.fn(),
};

describe('GroupMembersTable', () => {
    it('renders empty message when no users', () => {
        renderWithTheme({ ...defaultProps, users: [] });
        expect(screen.getByText('No users')).toBeInTheDocument();
    });

    it('renders user rows with name, organisation and user type', () => {
        renderWithTheme(defaultProps);
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
        expect(screen.getByText('@org-a')).toBeInTheDocument();
        expect(screen.getByText('@org-b')).toBeInTheDocument();
        expect(screen.getByText('Admin')).toBeInTheDocument();
        expect(screen.getByText('General')).toBeInTheDocument();
    });

    it('renders column headers for Users, Organisation, User type', () => {
        renderWithTheme(defaultProps);
        expect(screen.getByText('Users')).toBeInTheDocument();
        expect(screen.getByText('Organisation')).toBeInTheDocument();
        expect(screen.getByText('User type')).toBeInTheDocument();
    });

    it('does not render checkbox column when showCheckboxColumn is false', () => {
        renderWithTheme(defaultProps);
        const checkboxes = screen.queryAllByRole('checkbox');
        expect(checkboxes).toHaveLength(0);
    });

    it('renders checkbox column when showCheckboxColumn is true', () => {
        renderWithTheme({
            ...defaultProps,
            showCheckboxColumn: true,
            selectedUserIds: new Set(['u2']),
        });
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('renders Member since column when showMemberSinceColumn is true', () => {
        renderWithTheme({ ...defaultProps, showMemberSinceColumn: true });
        expect(screen.getByText('Member since')).toBeInTheDocument();
    });

    it('calls onUserClick when user name link is clicked', () => {
        const onUserClick = vi.fn();
        renderWithTheme({ ...defaultProps, onUserClick });
        fireEvent.click(screen.getByRole('button', { name: 'Alice' }));
        expect(onUserClick).toHaveBeenCalledWith('u1');
    });

    it('calls onUserCheckboxChange when checkbox is toggled', () => {
        const onUserCheckboxChange = vi.fn();
        renderWithTheme({
            ...defaultProps,
            showCheckboxColumn: true,
            selectedUserIds: new Set(),
            adminUserIds: new Set(),
            onUserCheckboxChange,
        });
        const checkboxes = screen.getAllByRole('checkbox');
        const rowCheckboxes = checkboxes.slice(1);
        const firstRowCheckbox = rowCheckboxes[0];
        fireEvent.click(firstRowCheckbox);
        expect(onUserCheckboxChange).toHaveBeenCalledWith('u1', true);
    });

    it('disables checkbox for admin users', () => {
        renderWithTheme({
            ...defaultProps,
            showCheckboxColumn: true,
            selectedUserIds: new Set(),
            adminUserIds: new Set(['u1']),
        });
        const checkboxes = screen.getAllByRole('checkbox');
        const adminCheckbox = checkboxes[1];
        expect(adminCheckbox).toBeDisabled();
    });

    it('calls onNameMenuOpen when Users column sort button is clicked', () => {
        const onNameMenuOpen = vi.fn();
        renderWithTheme({ ...defaultProps, onNameMenuOpen });
        fireEvent.click(screen.getByLabelText('Sort or filter users'));
        expect(onNameMenuOpen).toHaveBeenCalled();
    });

    it('calls onMemberSinceMenuOpen when Member since sort button is clicked', () => {
        const onMemberSinceMenuOpen = vi.fn();
        renderWithTheme({
            ...defaultProps,
            showMemberSinceColumn: true,
            onMemberSinceMenuOpen,
        });
        fireEvent.click(screen.getByLabelText('Sort by member since'));
        expect(onMemberSinceMenuOpen).toHaveBeenCalled();
    });

    it('displays formatted date when user has memberSince', () => {
        const usersWithDates: GroupMembersTableUser[] = [
            { id: 'u1', name: 'Alice', organisation: 'org-a', userType: 'Admin', memberSince: '2026-01-15T00:00:00Z' },
        ];
        renderWithTheme({ ...defaultProps, users: usersWithDates, showMemberSinceColumn: true });
        expect(screen.getByText('15 Jan 2026')).toBeInTheDocument();
    });

    it('displays dash when user has no memberSince', () => {
        renderWithTheme({ ...defaultProps, showMemberSinceColumn: true });
        const dashes = screen.getAllByText('-');
        expect(dashes).toHaveLength(2);
    });
});
