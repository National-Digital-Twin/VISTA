import React, { useState, useEffect } from 'react';
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
    Stack,
    CircularProgress,
    Snackbar,
    Alert,
} from '@mui/material';
import { fetchAllInvites, Invite, cancelInvite, resendInvite } from '@/api/invites';
import { SortableTableHeader } from '@/components/SortableTableHeader';

type SortField = 'email' | 'userType' | 'groups' | 'status' | 'daysAgo';
type SortDirection = 'asc' | 'desc';

const InvitesTab: React.FC = () => {
    const navigate = useNavigate();
    const [invites, setInvites] = useState<Invite[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortField, setSortField] = useState<SortField>('email');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        const loadInvites = async () => {
            try {
                const data = await fetchAllInvites();
                setInvites(data);
            } catch {
                // eslint-disable-next-line no-empty
            } finally {
                setLoading(false);
            }
        };

        loadInvites();
    }, []);

    const handleInviteNewUser = () => {
        navigate('/admin/invite');
    };

    const handleCancelInvite = async (inviteId: string) => {
        try {
            await cancelInvite(inviteId);
            const data = await fetchAllInvites();
            setInvites(data);
            setSuccess('Invite cancelled successfully');
        } catch {
            setError('Failed to cancel invite. Please try again.');
        }
    };

    const handleSendReminder = async (inviteId: string) => {
        try {
            await resendInvite(inviteId);
            setSuccess('Reminder sent successfully');
        } catch {
            setError('Failed to send reminder. Please try again.');
        }
    };

    const handleReinvite = async (inviteId: string) => {
        try {
            await resendInvite(inviteId);
            const data = await fetchAllInvites();
            setInvites(data);
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

    const sortInvites = (a: Invite, b: Invite): number => {
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

        const aValue = getField(a);
        const bValue = getField(b);

        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        return 0;
    };

    const sortedInvites = [...invites].sort(sortInvites);

    if (loading) {
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
                            <TableCell align="right"></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedInvites.map((invite) => (
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
                                    <Typography variant="body2">{invite.groups.join(', ')}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">{invite.status}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">{invite.daysAgo} days ago</Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        {invite.status === 'Pending' && (
                                            <>
                                                <Button variant="outlined" size="small" color="error" onClick={() => handleCancelInvite(invite.id)}>
                                                    CANCEL
                                                </Button>
                                                <Button variant="outlined" size="small" onClick={() => handleSendReminder(invite.id)}>
                                                    SEND REMINDER
                                                </Button>
                                            </>
                                        )}
                                        {invite.status === 'Expired' && (
                                            <Button variant="outlined" size="small" onClick={() => handleReinvite(invite.id)}>
                                                RE-INVITE USER
                                            </Button>
                                        )}
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

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
