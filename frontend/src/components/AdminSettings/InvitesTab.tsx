import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Snackbar,
    Alert,
    IconButton,
    Menu,
    MenuItem,
    ListItemText,
} from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { useQuery } from '@tanstack/react-query';
import { fetchAllInvites, Invite, cancelInvite, resendInvite } from '@/api/invites';
import { SortableTableHeader } from '@/components/SortableTableHeader';

type SortField = 'email' | 'userType' | 'groups' | 'status' | 'daysAgo';
type SortDirection = 'asc' | 'desc';

const InvitesTab = () => {
    const navigate = useNavigate();
    const [sortField, setSortField] = useState<SortField>('email');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; invite: Invite } | null>(null);

    const {
        data: invites = [],
        isLoading,
        refetch,
    } = useQuery<Invite[], Error>({
        queryKey: ['invites'],
        queryFn: fetchAllInvites,
    });

    const handleInviteNewUser = () => {
        navigate('/admin/invite');
    };

    const handleCloseMenu = () => {
        setMenuAnchor(null);
    };

    const handleCancelInvite = async () => {
        if (!menuAnchor) {
            return;
        }
        const { invite } = menuAnchor;
        handleCloseMenu();
        try {
            await cancelInvite(invite.id);
            refetch();
            setSuccess('Invite removed successfully');
        } catch {
            setError('Failed to remove invite. Please try again.');
        }
    };

    const handleReinvite = async () => {
        if (!menuAnchor) {
            return;
        }
        const { invite } = menuAnchor;
        handleCloseMenu();
        try {
            await resendInvite(invite.id);
            refetch();
            setSuccess('User re-invited successfully');
        } catch {
            setError('Failed to re-invite user. Please try again.');
        }
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const sortedInvites = useMemo(() => {
        const getField = (invite: Invite): string | number => {
            switch (sortField) {
                case 'email':
                    return invite.email;
                case 'userType':
                    return invite.userType;
                case 'groups':
                    return invite.groups.join(', ');
                case 'status':
                    return invite.status;
                case 'daysAgo':
                    return invite.daysAgo;
                default:
                    return '';
            }
        };
        return [...invites].sort((a, b) => {
            const aValue = getField(a);
            const bValue = getField(b);
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            }
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
            }
            return 0;
        });
    }, [invites, sortField, sortDirection]);

    const formatGroupAccess = (invite: Invite): string => {
        if (invite.groups.length === 0) {
            return '(no groups)';
        }
        return invite.groups.join(', ');
    };

    const formatInviteSent = (daysAgo: number): string => {
        if (daysAgo === 0) {
            return 'Today';
        }
        if (daysAgo === 1) {
            return '1 day ago';
        }
        return `${daysAgo} days ago`;
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h2">
                    Manage user invites
                </Typography>
                <Button variant="contained" onClick={handleInviteNewUser}>
                    INVITE NEW USER
                </Button>
            </Box>

            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <SortableTableHeader field="email" label="Email address" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                            <SortableTableHeader field="userType" label="User type" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                            <SortableTableHeader field="groups" label="Group access" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                            <SortableTableHeader field="status" label="Invite status" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                            <SortableTableHeader field="daysAgo" label="Invite sent" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                            <TableCell padding="none" width={48} align="right" />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedInvites.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        No pending invites
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedInvites.map((invite) => {
                                const isMenuOpen = Boolean(menuAnchor) && menuAnchor?.invite.id === invite.id;
                                return (
                                    <TableRow key={invite.id}>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="medium">
                                                {invite.email}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{invite.userType}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{formatGroupAccess(invite)}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{invite.status}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{formatInviteSent(invite.daysAgo)}</Typography>
                                        </TableCell>
                                        <TableCell padding="none" align="right">
                                            <IconButton
                                                size="small"
                                                aria-label="Invite actions"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setMenuAnchor({ el: e.currentTarget, invite });
                                                }}
                                                sx={{
                                                    'backgroundColor': isMenuOpen ? 'rgba(0, 0, 0, 0.12)' : 'rgba(0, 0, 0, 0.04)',
                                                    'borderRadius': '4px',
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(0, 0, 0, 0.08)',
                                                    },
                                                }}
                                            >
                                                <MoreHorizIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Menu
                anchorEl={menuAnchor?.el ?? null}
                open={Boolean(menuAnchor)}
                onClose={handleCloseMenu}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{
                    paper: {
                        sx: {
                            minWidth: 180,
                            mt: 0.5,
                        },
                    },
                }}
            >
                {menuAnchor?.invite.status === 'Pending' && (
                    <>
                        <MenuItem onClick={handleReinvite}>
                            <ListItemText>Re-invite user</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={handleCancelInvite} sx={{ color: 'error.main' }}>
                            <ListItemText>Remove invite</ListItemText>
                        </MenuItem>
                    </>
                )}
                {menuAnchor?.invite.status === 'Expired' && (
                    <MenuItem onClick={handleReinvite}>
                        <ListItemText>Re-invite user</ListItemText>
                    </MenuItem>
                )}
            </Menu>

            <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity="success" onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            </Snackbar>

            <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity="error" onClose={() => setError(null)}>
                    {error}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default InvitesTab;
