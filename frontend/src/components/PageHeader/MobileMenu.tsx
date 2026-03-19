// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import CloseIcon from '@mui/icons-material/Close';
import { Badge, Box, Drawer, IconButton, List, ListItemButton, ListItemText } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigation } from '@/hooks/useNavigation';

type MobileMenuProps = {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly onNavigationClick?: (item: string) => void;
    readonly appName: string;
    readonly dataRoomPendingCount?: number;
};

const DRAWER_WIDTH = 320;

export default function MobileMenu({ isOpen, onClose, onNavigationClick, appName, dataRoomPendingCount = 0 }: MobileMenuProps) {
    const theme = useTheme();
    const { navigationItems, isActive, handleNavigationClick, isMobile } = useNavigation();

    const handleClick = (item: { to: string; label: string }) => {
        onNavigationClick?.(item.label);
        handleNavigationClick(item);
        onClose();
    };

    return (
        <Drawer
            variant={isMobile ? 'temporary' : 'permanent'}
            open={isOpen}
            onClose={onClose}
            sx={{
                'width': DRAWER_WIDTH,
                'flexShrink': 0,
                '& .MuiDrawer-paper': {
                    width: DRAWER_WIDTH,
                    boxSizing: 'border-box',
                    border: 'none',
                    backgroundColor: theme.palette.secondary.main,
                    color: 'white',
                },
            }}
        >
            <Box
                sx={{
                    height: '60px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingX: '1rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
                }}
            >
                <IconButton component="div" onClick={() => onClose()}>
                    <Box component="img" width={100} src="/logo.svg" alt={`${appName} Logo`} />
                </IconButton>

                {isMobile && (
                    <IconButton
                        onClick={onClose}
                        sx={{
                            'color': 'white',
                            'padding': '8px',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            },
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                )}
            </Box>

            <Box sx={{ flex: 1, padding: 1 }}>
                <List sx={{ padding: 0 }}>
                    {navigationItems.map((item) => {
                        const showBadge = item.to === '/data-room' && dataRoomPendingCount > 0;
                        const primary = showBadge ? (
                            <Badge
                                badgeContent={dataRoomPendingCount}
                                color="error"
                                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                                overlap="rectangular"
                                sx={{ '& .MuiBadge-badge': { top: 4, right: 4 } }}
                            >
                                <span>{item.label}</span>
                            </Badge>
                        ) : (
                            item.label
                        );
                        return (
                            <ListItemButton
                                key={item.to}
                                onClick={() => handleClick(item)}
                                selected={isActive(item.to)}
                                sx={{
                                    'borderRadius': 1,
                                    'margin': 0.5,
                                    'color': isActive(item.to) ? theme.palette.accent?.main || theme.palette.primary.light : 'white',
                                    '&.Mui-selected': {
                                        'backgroundColor': 'rgba(255, 255, 255, 0.08)',
                                        '&:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.12)',
                                        },
                                    },
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                    },
                                }}
                            >
                                <ListItemText primary={primary} />
                            </ListItemButton>
                        );
                    })}
                </List>
            </Box>
        </Drawer>
    );
}
