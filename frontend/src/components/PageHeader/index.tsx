import { AppBar, Box, Toolbar, useMediaQuery, Typography, Link } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import MobileMenu from './MobileMenu';
import Navigation from './Navigation';
import Notifications from './Notifications';
import UserMenu from './UserMenu';
import { fetchScenarios } from '@/api/scenarios';
import { useActiveScenario } from '@/hooks/useActiveScenario';
import { useUserData } from '@/hooks/useUserData';

type PageHeaderProps = {
    appName: string;
};

const PageHeader = ({ appName }: Readonly<PageHeaderProps>) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [unseenNotifications] = useState(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { data: activeScenario } = useActiveScenario();
    const { getUserType } = useUserData();
    const isAdmin = getUserType() === 'Admin';
    const { data: scenarios = [] } = useQuery({
        queryKey: ['scenarios'],
        queryFn: fetchScenarios,
        staleTime: 5 * 60 * 1000,
        enabled: isAdmin,
    });
    const dataRoomPendingCount = useMemo(() => scenarios.reduce((sum, s) => sum + (s.pendingExposureCount ?? 0), 0), [scenarios]);

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

    const handleScenarioClick = useCallback(() => {
        if (isAdmin) {
            navigate('/data-room?openScenarioModal=true');
        }
    }, [isAdmin, navigate]);

    const scenarioName = useMemo(() => {
        if (activeScenario) {
            const name = activeScenario.name ? activeScenario.name : '';
            const code = activeScenario.code ? activeScenario.code : '';
            return `${code} ${name}`;
        }

        return '';
    }, [activeScenario]);

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
                    <Navigation onNavigationClick={handleNavigationClick} dataRoomPendingCount={isAdmin ? dataRoomPendingCount : 0} />
                </Box>

                {scenarioName && (
                    <Box
                        sx={{
                            position: 'absolute',
                            left: '50%',
                            transform: 'translateX(-50%)',
                        }}
                    >
                        {isAdmin ? (
                            <Link
                                component="button"
                                onClick={handleScenarioClick}
                                aria-label={`Change scenario: ${scenarioName}`}
                                sx={{
                                    'color': 'inherit',
                                    'textDecoration': 'none',
                                    'cursor': 'pointer',
                                    '&:hover': {
                                        textDecoration: 'underline',
                                    },
                                    'border': 'none',
                                    'background': 'none',
                                    'padding': 0,
                                    'font': 'inherit',
                                }}
                            >
                                <Typography component="span" sx={{ fontWeight: 500 }}>
                                    {scenarioName}
                                </Typography>
                            </Link>
                        ) : (
                            <Typography sx={{ fontWeight: 500 }} aria-label={`Current scenario: ${scenarioName}`}>
                                {scenarioName}
                            </Typography>
                        )}
                    </Box>
                )}

                <Box display="flex" gap={1} alignItems="center">
                    <Notifications unseenCount={unseenNotifications} onClick={handleNotificationClick} />
                    <UserMenu onMyProfileClick={handleMyProfileClick} onAdminSettingsClick={handleAdminSettingsClick} onPrivacyClick={handlePrivacyNotice} />
                </Box>
            </Toolbar>

            {isMobile && (
                <MobileMenu
                    isOpen={isMobileMenuOpen}
                    onClose={handleMobileMenuClose}
                    onNavigationClick={handleNavigationClick}
                    appName={appName}
                    dataRoomPendingCount={isAdmin ? dataRoomPendingCount : 0}
                />
            )}
        </AppBar>
    );
};

export default PageHeader;
