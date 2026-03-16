// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Notifications as NotificationsIcon } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import PageContainer from '@/components/PageContainer';

export default function Notifications() {
    return (
        <PageContainer sx={{ minHeight: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <NotificationsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                <Typography variant="h4" component="h1">
                    Notifications
                </Typography>
            </Box>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                This is a placeholder for the notifications page. The design and functionality will be implemented in a future update.
            </Typography>

            <Box sx={{ textAlign: 'center', py: 8 }}>
                <NotificationsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                    Notifications Coming Soon
                </Typography>
                <Typography variant="body2" color="text.disabled">
                    This feature is under development.
                </Typography>
            </Box>
        </PageContainer>
    );
}
