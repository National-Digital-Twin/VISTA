import { Storage as StorageIcon } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import PageContainer from '@/components/PageContainer';

export default function DataRoom() {
    return (
        <PageContainer sx={{ minHeight: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <StorageIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                <Typography variant="h4" component="h1">
                    Data Room
                </Typography>
            </Box>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                This is a placeholder for the data room page. The design and functionality will be implemented in a future update.
            </Typography>

            <Box sx={{ textAlign: 'center', py: 8 }}>
                <StorageIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                    Data Room Coming Soon
                </Typography>
                <Typography variant="body2" color="text.disabled">
                    This feature is under development.
                </Typography>
            </Box>
        </PageContainer>
    );
}
