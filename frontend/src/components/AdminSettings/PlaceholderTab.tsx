import React from 'react';
import { Box, Typography } from '@mui/material';

type PlaceholderTabProps = {
    title: string;
    description?: string;
};

const PlaceholderTab: React.FC<PlaceholderTabProps> = ({ title, description }) => {
    return (
        <Box>
            <Typography variant="h5" component="h2" gutterBottom>
                {title}{' '}
                <Typography component="span" sx={{ fontStyle: 'italic' }}>
                    (coming soon)
                </Typography>
            </Typography>
            {description && (
                <Typography variant="body1" color="text.secondary">
                    {description}
                </Typography>
            )}
        </Box>
    );
};

export default PlaceholderTab;
