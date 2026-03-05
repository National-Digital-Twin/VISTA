// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Box, Typography } from '@mui/material';
import React from 'react';

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
