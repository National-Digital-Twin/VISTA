import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PageContainer from '@/components/PageContainer';

const GroupDetail: React.FC = () => {
    const { groupName } = useParams<{ groupName: string }>();
    const navigate = useNavigate();

    const handleBackClick = () => {
        navigate('/admin?tab=users');
    };

    return (
        <PageContainer>
            <Box sx={{ mb: 4 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={handleBackClick} sx={{ mb: 2 }}>
                    Back to Users
                </Button>
                <Typography variant="h4" component="h1" gutterBottom>
                    Group Details
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Group: {groupName ? decodeURIComponent(groupName) : 'Unknown'}
                </Typography>
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '400px',
                }}
            >
                <Typography variant="h5" color="text.secondary" gutterBottom>
                    Coming Soon
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Group detail information will be available here soon.
                </Typography>
            </Box>
        </PageContainer>
    );
};

export default GroupDetail;
