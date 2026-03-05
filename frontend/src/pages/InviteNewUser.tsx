// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { ArrowBack } from '@mui/icons-material';
import {
    Box,
    Button,
    FormControlLabel,
    Radio,
    RadioGroup,
    TextField,
    Typography,
    Link,
    Alert,
    Snackbar,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Checkbox,
    Divider,
    CircularProgress,
} from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllGroups, type Group } from '@/api/groups';
import { sendInvite, InviteData } from '@/api/invites';
import PageContainer from '@/components/PageContainer';
import { SortableTableHeader } from '@/components/SortableTableHeader';

type GroupSortDirection = 'asc' | 'desc';

export default function InviteNewUser() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [userType, setUserType] = useState<'Admin' | 'General' | ''>('');
    const [email, setEmail] = useState('');
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [groupSortField, setGroupSortField] = useState<'name'>('name');
    const [groupSortDirection, setGroupSortDirection] = useState<GroupSortDirection>('asc');
    const [groups, setGroups] = useState<Group[]>([]);
    const [groupsLoading, setGroupsLoading] = useState(true);

    useEffect(() => {
        fetchAllGroups()
            .then(setGroups)
            .catch(() => {})
            .finally(() => setGroupsLoading(false));
    }, []);

    const handleBackClick = () => {
        navigate('/admin?tab=invites');
    };

    const handleGroupToggle = (groupId: string) => {
        setSelectedGroups((prev) => (prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]));
    };

    const handleViewGroup = (groupId: string) => {
        navigate(`/admin?tab=groups&group=${encodeURIComponent(groupId)}`);
    };

    const handleGroupSort = (field: 'name') => {
        if (groupSortField === field) {
            setGroupSortDirection(groupSortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setGroupSortField(field);
            setGroupSortDirection('asc');
        }
    };

    const compareGroups = useCallback(
        (a: Group, b: Group): number => {
            const aValue = a.name;
            const bValue = b.name;
            return groupSortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        },
        [groupSortDirection],
    );

    const sortedGroups = useMemo(() => [...groups].sort(compareGroups), [groups, compareGroups]);

    const handleSendInvite = async () => {
        if (!email.trim()) {
            setError('Please enter an email address');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const inviteData: InviteData = {
                userType: userType as 'Admin' | 'General',
                email: email.trim(),
                groups: selectedGroups,
            };

            await sendInvite(inviteData);
            await queryClient.refetchQueries({ queryKey: ['invites'] });
            setSuccess(true);

            setTimeout(() => {
                navigate('/admin?tab=invites');
            }, 1500);
        } catch {
            setError('Failed to send invite. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const isFormValid = email.trim().length > 0 && userType !== '';

    return (
        <PageContainer sx={{ minHeight: '100%' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gridTemplateRows: 'auto 1fr auto', columnGap: 2, rowGap: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton sx={{ p: 1 }} onClick={handleBackClick}>
                        <ArrowBack />
                    </IconButton>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'space-between' }}>
                    <Typography variant="h4" component="h1">
                        Invite new user
                    </Typography>
                </Box>

                <Box />

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 6, width: '100%' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(max-content, 120px) auto', gap: 2, alignItems: 'center' }}>
                            <Typography variant="body1" fontWeight="medium">
                                User type
                            </Typography>
                            <RadioGroup value={userType} onChange={(e) => setUserType(e.target.value as 'Admin' | 'General')} row>
                                <FormControlLabel value="Admin" control={<Radio />} label="Admin" />
                                <FormControlLabel value="General" control={<Radio />} label="General" />
                            </RadioGroup>
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(max-content, 120px) auto', gap: 2, alignItems: 'center' }}>
                            <Typography variant="body1" fontWeight="medium">
                                Email address
                            </Typography>
                            <TextField
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                fullWidth
                                type="email"
                                variant="standard"
                                placeholder="Enter email address"
                                sx={{
                                    '& .MuiInput-root': {
                                        backgroundColor: '#f5f5f5',
                                        borderRadius: 1,
                                        px: 1,
                                        py: 0.5,
                                    },
                                }}
                            />
                        </Box>
                    </Box>

                    <Divider orientation="vertical" flexItem />

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography variant="h6" component="h2">
                            Group access <span style={{ fontWeight: 300 }}>(optional)</span>
                        </Typography>

                        {groupsLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                <CircularProgress size={24} />
                            </Box>
                        ) : (
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    indeterminate={selectedGroups.length > 0 && selectedGroups.length < groups.length}
                                                    checked={groups.length > 0 && selectedGroups.length === groups.length}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedGroups(groups.map((g) => g.id));
                                                        } else {
                                                            setSelectedGroups([]);
                                                        }
                                                    }}
                                                />
                                            </TableCell>
                                            <SortableTableHeader
                                                field="name"
                                                label="Groups"
                                                sortField={groupSortField}
                                                sortDirection={groupSortDirection}
                                                onSort={handleGroupSort}
                                            />
                                            <TableCell align="right" />
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {sortedGroups.map((group) => (
                                            <TableRow key={group.id}>
                                                <TableCell padding="checkbox">
                                                    <Checkbox checked={selectedGroups.includes(group.id)} onChange={() => handleGroupToggle(group.id)} />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">{group.name}</Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Link
                                                        component="button"
                                                        variant="body2"
                                                        color="primary"
                                                        onClick={() => handleViewGroup(group.id)}
                                                        sx={{
                                                            'textDecoration': 'none',
                                                            '&:hover': { textDecoration: 'underline' },
                                                        }}
                                                    >
                                                        view group
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Box>
                </Box>

                <Box />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button variant="outlined" onClick={handleBackClick} disabled={isLoading}>
                        CANCEL
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSendInvite}
                        disabled={!isFormValid || isLoading}
                        sx={{
                            backgroundColor: isFormValid ? 'primary.main' : 'action.disabled',
                            color: isFormValid ? 'primary.contrastText' : 'action.disabled',
                        }}
                    >
                        {isLoading ? 'SENDING...' : 'SEND INVITE'}
                    </Button>
                </Box>
            </Box>

            <Snackbar open={success} autoHideDuration={3000} onClose={() => setSuccess(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity="success" onClose={() => setSuccess(false)}>
                    Invite sent successfully!
                </Alert>
            </Snackbar>

            <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity="error" onClose={() => setError(null)}>
                    {error}
                </Alert>
            </Snackbar>
        </PageContainer>
    );
}
