import { AppBar, Box, Toolbar, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import MobileMenu from './MobileMenu';
import Navigation from './Navigation';
import Notifications from './Notifications';
import UserMenu from './UserMenu';

type PageHeaderProps = {
    appName: string;
};

const PageHeader = ({ appName }: Readonly<PageHeaderProps>) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [unseenNotifications] = useState(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleMobileMenuClick = () => {
        setIsMobileMenuOpen(true);
    };

    const handleMobileMenuClose = () => {
        setIsMobileMenuOpen(false);
    };

    const handleNavigationClick = (item: string) => {
        switch (item) {
            case 'Data room':
                navigate('/data-room');
                break;
            case 'Map':
                navigate('/');
                break;
        }
    };

    const handleNotificationClick = () => {
        navigate('/notifications');
    };

    const handleMyProfileClick = () => {
        navigate('/profile');
    };

    const handleAdminSettingsClick = () => {
        navigate('/admin');
    };

    const handlePrivacyNotice = () => {
        navigate('/privacy');
    };

    return (
        <AppBar
            position="static"
            sx={{
                height: 60,
                backgroundColor: 'secondary.main',
                borderColor: 'primary.main',
            }}
        >
            <Toolbar
                variant="dense"
                sx={{
                    height: '100%',
                    display: 'flex',
                    paddingX: '1rem',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
                disableGutters
            >
                <Box display="flex" alignItems="center" gap={3}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Logo appName={appName} onMobileMenuClick={handleMobileMenuClick} />
                    </Box>
                    <Navigation onNavigationClick={handleNavigationClick} />
                </Box>

                <Box display="flex" gap={1} alignItems="center">
                    <Notifications unseenCount={unseenNotifications} onClick={handleNotificationClick} />
                    <UserMenu onMyProfileClick={handleMyProfileClick} onAdminSettingsClick={handleAdminSettingsClick} onPrivacyClick={handlePrivacyNotice} />
                </Box>
            </Toolbar>

            {isMobile && <MobileMenu isOpen={isMobileMenuOpen} onClose={handleMobileMenuClose} onNavigationClick={handleNavigationClick} appName={appName} />}
        </AppBar>
    );
};

export default PageHeader;
