import React from 'react';
import { Box, Typography } from '@mui/material';

interface PlaceholderTabProps {
    title: string;
    description?: string;
}

const PlaceholderTab: React.FC<PlaceholderTabProps> = ({ title, description }) => {
    return (
        <Box>
            <Typography variant="h5" component="h2" gutterBottom>
                {title}
            </Typography>
            <Typography variant="body1" color="text.secondary">
                {description || 'This functionality will be implemented soon.'}
            </Typography>
        </Box>
    );
};

export default PlaceholderTab;
