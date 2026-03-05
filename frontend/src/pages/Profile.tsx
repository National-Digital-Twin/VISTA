// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { ArrowBack, Edit } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import { Alert, Box, Button, Divider, IconButton, Snackbar, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { signout } from '@/api/auth';
import PageContainer from '@/components/PageContainer';
import config from '@/config/app-config';
import { useProfileData } from '@/hooks/useProfileData';

export default function Profile() {
    const { userId } = useParams<{ userId?: string }>();
    const navigate = useNavigate();
    const { getUserDisplayName, getUserOrganisation, getUserMemberSince, getUserAddedBy, getUserType, getUserEmail, loading, error, currentUserId } =
        useProfileData(userId);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const handleBackClick = () => {
        if (userId) {
            navigate('/admin?tab=users');
        } else {
            navigate('/');
        }
    };

    const handleDeleteUser = () => {
        setShowDeleteModal(true);
    };

    const handleCloseModal = () => {
        setShowDeleteModal(false);
        setConfirmText('');
    };

    const handleConfirmDelete = async () => {
        if (confirmText !== 'delete' || !userId) {
            return;
        }

        try {
            const response = await fetch(`${config.services.users}${userId}/`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                throw new Error('Failed to delete user');
            }

            handleCloseModal();
            await queryClient.refetchQueries({ queryKey: ['invites'] });
            await queryClient.refetchQueries({ queryKey: ['users'] });

            if (currentUserId && userId === currentUserId) {
                await signout();
                return;
            }

            setSuccessMessage('User deleted');
            setTimeout(() => {
                navigate('/admin?tab=users');
            }, 1500);
        } catch {
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
                            onClick={handleDeleteUser}
                            sx={{
                                'boxShadow': 'none',
                                '&:hover': {
                                    boxShadow: 'none',
                                },
                            }}
                        >
                            DELETE USER
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

            <Dialog open={showDeleteModal} onClose={handleCloseModal} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Are you sure?
                    <IconButton onClick={handleCloseModal} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Deleting this user will result in them losing access to VISTA.
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
                        onClick={handleConfirmDelete}
                        variant="contained"
                        color="error"
                        disabled={confirmText !== 'delete'}
                        sx={{
                            flex: 2,
                            height: 48,
                            borderRadius: 1,
                        }}
                    >
                        CONFIRM DELETION
                    </Button>
                </DialogActions>
            </Dialog>
            <Snackbar
                open={!!successMessage}
                autoHideDuration={5000}
                onClose={() => setSuccessMessage(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity="success" onClose={() => setSuccessMessage(null)}>
                    {successMessage}
                </Alert>
            </Snackbar>
        </PageContainer>
    );
}
