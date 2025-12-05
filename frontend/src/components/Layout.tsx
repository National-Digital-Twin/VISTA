import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import PageHeader from './PageHeader';

export default function Layout() {
    return (
        <Box
            sx={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            <Box sx={{ flexShrink: 0 }}>
                <PageHeader appName="VISTA" />
            </Box>
            <Box
                sx={{
                    flex: '1 1 auto',
                    minHeight: 0,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    position: 'relative',
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
}
