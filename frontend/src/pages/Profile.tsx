import { ArrowBack, Edit } from '@mui/icons-material';
import {
    Box,
    Button,
    Divider,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Link,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useProfileData } from '@/hooks/useProfileData';
import PageContainer from '@/components/PageContainer';

export default function Profile() {
    const { userId } = useParams<{ userId?: string }>();
    const navigate = useNavigate();
    const { getUserDisplayName, getUserOrganisation, getUserMemberSince, getUserAddedBy, getUserType, getUserGroups, getUserEmail, loading, error } =
        useProfileData(userId);

    const groups = getUserGroups();
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [confirmText, setConfirmText] = useState('');

    const handleBackClick = () => {
        // TODO: Add proper permission check to determine if user is administrator
        if (!userId) {
            navigate('/');
        } else {
            navigate('/admin-settings?tab=users');
        }
    };

    const handleRemoveUser = () => {
        setShowRemoveModal(true);
    };

    const handleCloseModal = () => {
        setShowRemoveModal(false);
        setConfirmText('');
    };

    const handleConfirmRemove = async () => {
        if (confirmText !== 'delete' || !userId) {
            return;
        }

        try {
            // TODO: Replace with actual DELETE endpoint
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to remove user');
            }

            navigate('/admin-settings?tab=users');
        } catch (error) {
            console.error('Error removing user:', error);
        } finally {
            handleCloseModal();
        }
    };

    if (loading) {
        return (
            <PageContainer
                sx={{
                    minHeight: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Typography variant="h6">Loading user data...</Typography>
            </PageContainer>
        );
    }

    if (error) {
        return (
            <PageContainer
                sx={{
                    minHeight: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 2,
                }}
            >
                <Typography variant="h6" color="error">
                    Error loading profile
                </Typography>
                <Typography variant="body2">{error}</Typography>
                <Button variant="outlined" onClick={handleBackClick}>
                    Go Back
                </Button>
            </PageContainer>
        );
    }

    return (
        <PageContainer sx={{ minHeight: '100%' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gridTemplateRows: 'auto 1fr auto', columnGap: 2, rowGap: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton sx={{ p: 1 }} onClick={handleBackClick}>
                        <ArrowBack />
                    </IconButton>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h4" component="h1">
                            {getUserDisplayName()}
                        </Typography>
                        <IconButton sx={{ p: 1 }}>
                            <Edit />
                        </IconButton>
                    </Box>
                    {userId && (
                        <Button
                            variant="contained"
                            color="error"
                            onClick={handleRemoveUser}
                            sx={{
                                'boxShadow': 'none',
                                '&:hover': {
                                    boxShadow: 'none',
                                },
                            }}
                        >
                            REMOVE USER
                        </Button>
                    )}
                </Box>

                <Box sx={{ gridColumn: '2' }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(max-content, 240px) auto', gap: 2 }}>
                        <Typography fontWeight={'bold'}>Member since</Typography>
                        <Typography>{getUserMemberSince()}</Typography>
                        <Typography fontWeight={'bold'}>Added by</Typography>
                        <Typography>{getUserAddedBy()}</Typography>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 300 }}>
                            User details
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(max-content, 240px) auto', gap: 2 }}>
                            <Typography fontWeight={'bold'}>User type</Typography>
                            <Typography>{getUserType()}</Typography>

                            <Typography fontWeight={'bold'}>Email address</Typography>
                            <Typography>{getUserEmail()}</Typography>

                            <Typography fontWeight={'bold'}>Organisation</Typography>
                            <Typography>@{getUserOrganisation()}</Typography>
                        </Box>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    <Box>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 300 }}>
                            Group membership
                        </Typography>
                        <TableContainer sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, auto)' }}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', border: 'none', py: 1, px: 0 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>Groups</Box>
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', border: 'none', py: 1, px: 0 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>Member since</Box>
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {groups.length > 0 ? (
                                        groups.map((group) => (
                                            <TableRow key={group.name} sx={{ '&:last-child td': { border: 0 } }}>
                                                <TableCell sx={{ py: 1, px: 0 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Link
                                                            component="button"
                                                            color="primary"
                                                            onClick={() => navigate(`/group/${encodeURIComponent(group.name)}`)}
                                                            sx={{ cursor: 'pointer' }}
                                                        >
                                                            {group.name}
                                                        </Link>
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{ py: 1, px: 0 }}>{group.memberSince}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={2} sx={{ py: 2, px: 0, textAlign: 'center', color: 'text.secondary' }}>
                                                No group memberships
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gridColumn: '2', gap: 2 }}>
                    <Button variant="outlined" disabled>
                        CANCEL
                    </Button>
                    <Button variant="contained" disabled>
                        SAVE CHANGES
                    </Button>
                </Box>
            </Box>

            {/* Remove User Confirmation Modal */}
            <Dialog open={showRemoveModal} onClose={handleCloseModal} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Are you sure?
                    <IconButton onClick={handleCloseModal} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Removing this user will result in them losing access to VISTA.
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        Type delete to confirm
                    </Typography>
                    <TextField
                        fullWidth
                        variant="standard"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        sx={{
                            'mt': 1,
                            '& .MuiInput-root': {
                                backgroundColor: '#f5f5f5',
                                borderRadius: 1,
                                px: 1,
                                py: 0.5,
                            },
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0, mt: 2 }}>
                    <Button
                        onClick={handleCloseModal}
                        variant="outlined"
                        sx={{
                            flex: 1,
                            mr: 1,
                            height: 48,
                            borderRadius: 1,
                        }}
                    >
                        CANCEL
                    </Button>
                    <Button
                        onClick={handleConfirmRemove}
                        variant="contained"
                        color="error"
                        disabled={confirmText !== 'delete'}
                        sx={{
                            flex: 2,
                            height: 48,
                            borderRadius: 1,
                        }}
                    >
                        CONFIRM REMOVAL
                    </Button>
                </DialogActions>
            </Dialog>
        </PageContainer>
    );
}
