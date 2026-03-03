import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import { Box, Checkbox, IconButton, Link, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { format } from 'date-fns';
import { type MouseEvent } from 'react';

export type GroupMembersTableUser = {
    id: string;
    name: string;
    organisation: string;
    userType: string;
    memberSince?: string;
};

type GroupMembersTableProps = {
    readonly users: GroupMembersTableUser[];
    readonly showCheckboxColumn: boolean;
    readonly selectedUserIds: Set<string>;
    readonly adminUserIds: Set<string>;
    readonly onUserCheckboxChange: (userId: string, checked: boolean) => void;
    readonly onSelectAll: (checked: boolean) => void;
    readonly allVisibleUsersSelected: boolean;
    readonly someVisibleUsersSelected: boolean;
    readonly onUserClick: (userId: string) => void;
    readonly showMemberSinceColumn: boolean;
    readonly emptyMessage: string;
    readonly onNameMenuOpen: (e: MouseEvent<HTMLElement>) => void;
    readonly onOrganisationMenuOpen: (e: MouseEvent<HTMLElement>) => void;
    readonly onUserTypeMenuOpen: (e: MouseEvent<HTMLElement>) => void;
    readonly onMemberSinceMenuOpen?: (e: MouseEvent<HTMLElement>) => void;
};

const colSpan = (showCheckbox: boolean, showMemberSince: boolean) => 3 + (showCheckbox ? 1 : 0) + (showMemberSince ? 1 : 0);

export function GroupMembersTable({
    users,
    showCheckboxColumn,
    selectedUserIds,
    adminUserIds,
    onUserCheckboxChange,
    onSelectAll,
    allVisibleUsersSelected,
    someVisibleUsersSelected,
    onUserClick,
    showMemberSinceColumn,
    emptyMessage,
    onNameMenuOpen,
    onOrganisationMenuOpen,
    onUserTypeMenuOpen,
    onMemberSinceMenuOpen,
}: GroupMembersTableProps) {
    return (
        <TableContainer sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
            <Table stickyHeader>
                <TableHead>
                    <TableRow>
                        {showCheckboxColumn && (
                            <TableCell padding="checkbox">
                                <Checkbox
                                    checked={allVisibleUsersSelected}
                                    indeterminate={someVisibleUsersSelected}
                                    onChange={(e) => onSelectAll(e.target.checked)}
                                />
                            </TableCell>
                        )}
                        <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                Users
                                <IconButton size="small" onClick={onNameMenuOpen} sx={{ p: 0.5 }} aria-label="Sort or filter users">
                                    <UnfoldMoreIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </TableCell>
                        <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                Organisation
                                <IconButton size="small" onClick={onOrganisationMenuOpen} sx={{ p: 0.5 }} aria-label="Filter by organisation">
                                    <UnfoldMoreIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </TableCell>
                        <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                User type
                                <IconButton size="small" onClick={onUserTypeMenuOpen} sx={{ p: 0.5 }} aria-label="Filter by user type">
                                    <UnfoldMoreIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </TableCell>
                        {showMemberSinceColumn && (
                            <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    Member since
                                    {onMemberSinceMenuOpen && (
                                        <IconButton size="small" onClick={onMemberSinceMenuOpen} sx={{ p: 0.5 }} aria-label="Sort by member since">
                                            <UnfoldMoreIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </Box>
                            </TableCell>
                        )}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {users.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={colSpan(showCheckboxColumn, showMemberSinceColumn)} align="center" sx={{ py: 4 }}>
                                <Typography variant="body2" color="text.secondary">
                                    {emptyMessage}
                                </Typography>
                            </TableCell>
                        </TableRow>
                    ) : (
                        users.map((user) => {
                            const isAdmin = adminUserIds.has(user.id);
                            const isSelected = selectedUserIds.has(user.id);
                            return (
                                <TableRow key={user.id} hover>
                                    {showCheckboxColumn && (
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={isSelected}
                                                disabled={isAdmin}
                                                onChange={(e) => onUserCheckboxChange(user.id, e.target.checked)}
                                                sx={isAdmin ? { '& .MuiSvgIcon-root': { color: 'action.disabled' } } : undefined}
                                            />
                                        </TableCell>
                                    )}
                                    <TableCell>
                                        <Link
                                            component="button"
                                            color="primary"
                                            onClick={() => onUserClick(user.id)}
                                            sx={{ cursor: 'pointer', textDecoration: 'none' }}
                                        >
                                            {user.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell>@{user.organisation}</TableCell>
                                    <TableCell>{user.userType}</TableCell>
                                    {showMemberSinceColumn && (
                                        <TableCell>{user.memberSince ? format(new Date(user.memberSince), 'd MMM yyyy') : '-'}</TableCell>
                                    )}
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
