import { useMediaQuery, useTheme } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

export interface NavigationItem {
    to: string;
    label: string;
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
    { to: '/data-room', label: 'Data room' },
    { to: '/', label: 'Map' },
];

export const useNavigation = () => {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const isActive = (path: string) => pathname === path;

    const handleLink = () => {
        document.documentElement.scrollTo(0, 0);
    };

    const handleNavigationClick = (item: NavigationItem) => {
        console.log(`${item.label} navigation clicked - navigating to ${item.to}`);
        navigate(item.to);
        handleLink();
    };

    return {
        navigationItems: NAVIGATION_ITEMS,
        isActive,
        handleLink,
        handleNavigationClick,
        isMobile,
    };
};
