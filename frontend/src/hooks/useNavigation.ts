// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { useMediaQuery, useTheme } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

export type NavigationItem = {
    to: string;
    label: string;
};

export const NAVIGATION_ITEMS: NavigationItem[] = [
    { to: '/data-room', label: 'Data room' },
    { to: '/', label: 'Map' },
];

export const useNavigation = () => {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const isActive = (path: string) => (path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(`${path}/`));

    const handleLink = () => {
        document.documentElement.scrollTo(0, 0);
    };

    const handleNavigationClick = (item: NavigationItem) => {
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
