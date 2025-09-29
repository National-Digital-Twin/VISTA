import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { ElementsProvider } from '../context/ElementContext';
import PageHeader from './PageHeader';

export default function Layout() {
    return (
        <ElementsProvider>
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
                <Box sx={{ flexGrow: 1, overflow: 'hidden', position: 'relative' }}>
                    <Outlet />
                </Box>
            </Box>
        </ElementsProvider>
    );
}
