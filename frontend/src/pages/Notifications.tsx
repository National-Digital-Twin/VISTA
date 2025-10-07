import { Notifications as NotificationsIcon } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';

export default function Notifications() {
    return (
        <Box
            sx={{
                p: 3,
                minHeight: '100%',
                width: '100%',
                display: 'block',
                position: 'relative',
                backgroundColor: 'background.default',
                color: 'text.primary',
            }}
        >
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
        </Box>
    );
}
