// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Badge, Box, Button, useTheme } from '@mui/material';
import { useNavigation } from '@/hooks/useNavigation';

type NavigationProps = {
    readonly onNavigationClick?: (item: string) => void;
    readonly dataRoomPendingCount?: number;
};

export default function Navigation({ onNavigationClick, dataRoomPendingCount = 0 }: NavigationProps) {
    const theme = useTheme();
    const { navigationItems, isActive, handleNavigationClick, isMobile } = useNavigation();

    const handleClick = (item: { to: string; label: string }) => {
        onNavigationClick?.(item.label);
        handleNavigationClick(item);
    };

    if (isMobile) {
        return null;
    }

    return (
        <Box display="flex" gap={2}>
            {navigationItems.map((item) => {
                const showBadge = item.to === '/data-room' && dataRoomPendingCount > 0;
                const button = (
                    <Button
                        key={item.to}
                        variant="text"
                        onClick={() => handleClick(item)}
                        sx={{
                            'color': isActive(item.to) ? theme.palette.accent?.main || theme.palette.primary.light : 'white',
                            'textTransform': 'uppercase',
                            'fontWeight': isActive(item.to) ? 600 : 500,
                            'fontSize': '1rem',
                            '&:hover': {
                                color: theme.palette.accent?.main || theme.palette.primary.light,
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            },
                        }}
                    >
                        {item.label}
                    </Button>
                );
                return showBadge ? (
                    <Badge
                        key={item.to}
                        badgeContent={dataRoomPendingCount}
                        color="error"
                        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                        overlap="rectangular"
                        sx={{ 'display': 'inline-flex', '& .MuiBadge-badge': { top: 6, right: 6 } }}
                    >
                        {button}
                    </Badge>
                ) : (
                    button
                );
            })}
        </Box>
    );
}
